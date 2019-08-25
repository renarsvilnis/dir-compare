import fs, { Stats } from "fs";
import bufferEqual from "buffer-equal";
import Promise from "bluebird";

import FileDescriptorQueue from "../utils/FileDescriptorQueue";
import { closeFilesSync, closeFilesAsync } from "./common";
import BufferPool, { BufferPoolEntry } from "../utils/BufferPool";
import { Options } from "../types";

const MAX_CONCURRENT_FILE_COMPARE = 8;
const BUF_SIZE = 100000;
const fdQueue = new FileDescriptorQueue(MAX_CONCURRENT_FILE_COMPARE * 2);
var wrapper = require("./common").wrapper(fdQueue);

const bufferPool = new BufferPool(BUF_SIZE, MAX_CONCURRENT_FILE_COMPARE); // fdQueue guarantees there will be no more than MAX_CONCURRENT_FILE_COMPARE async processes accessing the buffers concurrently

/**
 * Compares two files by content.
 */
export function compareSync(path1: string, stat1: Stats, path2: string, stat2: Stats, options: Options) {
  let fd1: number | undefined;
  let fd2: number | undefined;
  const bufferPair = bufferPool.allocateBuffers();
  try {
    fd1 = fs.openSync(path1, "r");
    fd2 = fs.openSync(path2, "r");
    var buf1 = bufferPair.buf1;
    var buf2 = bufferPair.buf2;
    // let progress = 0;
    while (true) {
      var size1 = fs.readSync(fd1, buf1, 0, BUF_SIZE, null);
      var size2 = fs.readSync(fd2, buf2, 0, BUF_SIZE, null);
      if (size1 !== size2) {
        return false;
      } else if (size1 === 0) {
        // End of file reached
        return true;
      } else if (!compareBuffers(buf1, buf2, size1)) {
        return false;
      }
    }
  } finally {
    closeFilesSync(fd1, fd2);
    BufferPool.freeBuffers(bufferPair);
  }
}

/**
 * Compares two files by content
 */
export function compareAsync(path1: string, stat1: Stats, path2: string, stat2: Stats, options: Options) {
  let fd1: number | undefined;
  let fd2: number | undefined;
  let bufferPair: BufferPoolEntry | undefined;

  return Promise.all([wrapper.open(path1, "r"), wrapper.open(path2, "r")])
    .then(function(fds) {
      bufferPair = bufferPool.allocateBuffers();
      fd1 = fds[0];
      fd2 = fds[1];
      var buf1 = bufferPair.buf1;
      var buf2 = bufferPair.buf2;
      // let progress = 0;
      var compareAsyncInternal = (): Promise<boolean> => {
        return Promise.all([
          wrapper.read(fd1, buf1, 0, BUF_SIZE, null),
          wrapper.read(fd2, buf2, 0, BUF_SIZE, null)
        ]).then(function(bufferSizes) {
          var size1 = bufferSizes[0];
          var size2 = bufferSizes[1];
          if (size1 !== size2) {
            return false;
          } else if (size1 === 0) {
            // End of file reached
            return true;
          } else if (!compareBuffers(buf1, buf2, size1)) {
            return false;
          } else {
            return compareAsyncInternal();
          }
        });
      };
      return compareAsyncInternal();
    })
    .finally(function() {
      closeFilesAsync(fd1, fd2, fdQueue);
      if (bufferPair) {
        BufferPool.freeBuffers(bufferPair);
      }
    });
}

/**
 * Compares two partial buffers.
 */
function compareBuffers(buf1: Buffer, buf2: Buffer, contentSize: number): boolean {
  return bufferEqual(buf1.slice(0, contentSize), buf2.slice(0, contentSize));
}
