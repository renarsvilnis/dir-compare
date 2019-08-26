import { Stats } from "fs";
import bufferEqual from "buffer-equal";
import Promise from "bluebird";
import fs from "fs";
import { promisify } from "util";

import FileDescriptorQueue from "../utils/FileDescriptorQueue";
import { closeFilesAsync } from "./common";
import BufferPool, { BufferPoolEntry } from "../utils/BufferPool";

const MAX_CONCURRENT_FILE_COMPARE = 8;
const BUF_SIZE = 100000;
const fdQueue = new FileDescriptorQueue(MAX_CONCURRENT_FILE_COMPARE * 2);

const readAsync = promisify(fs.read);

const bufferPool = new BufferPool(BUF_SIZE, MAX_CONCURRENT_FILE_COMPARE); // fdQueue guarantees there will be no more than MAX_CONCURRENT_FILE_COMPARE async processes accessing the buffers concurrently

/**
 * Compares two files by content
 */
export default function defaultFileCompare(path1: string, stat1: Stats, path2: string, stat2: Stats, options?: {}) {
  let fd1: number | undefined;
  let fd2: number | undefined;
  let bufferPair: BufferPoolEntry | undefined;

  return Promise.all([fdQueue.open(path1, "r"), fdQueue.open(path2, "r")])
    .then(function([fd1, fd2]) {
      bufferPair = bufferPool.allocateBuffers();
      const buf1 = bufferPair.buf1;
      const buf2 = bufferPair.buf2;
      // let progress = 0;
      const compareAsyncInternal = (): Promise<boolean> => {
        return Promise.all([readAsync(fd1, buf1, 0, BUF_SIZE, null), readAsync(fd2, buf2, 0, BUF_SIZE, null)]).then(
          function(bufferSizes) {
            const size1 = bufferSizes[0];
            const size2 = bufferSizes[1];
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
          }
        );
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
