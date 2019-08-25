/**
 * Compare files line by line with options to ignore
 * line endings and white space differencies.
 */
import fs, { Stats } from "fs";
import Promise from "bluebird";
import FileDescriptorQueue from "../utils/FileDescriptorQueue";
import BufferPool from "../utils/BufferPool";
import { closeFilesSync, closeFilesAsync } from "./common";
import { Options } from "../types";
import { BufferPoolEntry } from "../utils/BufferPool";

const MAX_CONCURRENT_FILE_COMPARE = 8;
const BUF_SIZE = 100000;
const fdQueue = new FileDescriptorQueue(MAX_CONCURRENT_FILE_COMPARE * 2);
const wrapper = require("./common").wrapper(fdQueue);
const bufferPool = new BufferPool(BUF_SIZE, MAX_CONCURRENT_FILE_COMPARE); // fdQueue guarantees there will be no more than MAX_CONCURRENT_FILE_COMPARE async processes accessing the buffers concurrently

export function compareSync(path1: string, stat1: Stats, path2: string, stat2: Stats, options: Options) {
  var fd1, fd2;
  var bufferPair = bufferPool.allocateBuffers();
  try {
    fd1 = fs.openSync(path1, "r");
    fd2 = fs.openSync(path2, "r");
    var buf1 = bufferPair.buf1;
    var buf2 = bufferPair.buf2;
    // let progress = 0;
    var last1 = "",
      last2 = "";
    while (true) {
      var size1 = fs.readSync(fd1, buf1, 0, BUF_SIZE, null);
      var size2 = fs.readSync(fd2, buf2, 0, BUF_SIZE, null);
      var chunk1 = buf1.toString("utf8", 0, size1);
      var chunk2 = buf2.toString("utf8", 0, size2);
      var lines1 = (last1 + chunk1).split(/\n/);
      var lines2 = (last2 + chunk2).split(/\n/);
      if (size1 === 0 && size2 === 0) {
        // End of file reached
        return true;
      } else if (lines1.length !== lines2.length) {
        return false;
      } else {
        if (!compareLines(lines1, lines2, options)) {
          return false;
        }
        last1 = lines1[lines1.length - 1];
        last2 = lines2[lines2.length - 1];
      }
    }
  } finally {
    closeFilesSync(fd1, fd2);
    BufferPool.freeBuffers(bufferPair);
  }
}

export function compareAsync(path1: string, stat1: Stats, path2: string, stat2: Stats, options: Options) {
  let fd1: number;
  let fd2: number;
  let bufferPair: BufferPoolEntry | undefined;
  return Promise.all([wrapper.open(path1, "r"), wrapper.open(path2, "r")])
    .then(function(fds) {
      bufferPair = bufferPool.allocateBuffers();
      fd1 = fds[0];
      fd2 = fds[1];
      var buf1 = bufferPair.buf1;
      var buf2 = bufferPair.buf2;
      // let progress = 0;
      var last1 = "",
        last2 = "";
      var compareAsyncInternal = (): Promise<boolean> => {
        return Promise.all([
          wrapper.read(fd1, buf1, 0, BUF_SIZE, null),
          wrapper.read(fd2, buf2, 0, BUF_SIZE, null)
        ]).then(sizes => {
          var size1 = sizes[0];
          var size2 = sizes[1];
          var chunk1 = buf1.toString("utf8", 0, size1);
          var chunk2 = buf2.toString("utf8", 0, size2);
          var lines1 = (last1 + chunk1).split(/\n/);
          var lines2 = (last2 + chunk2).split(/\n/);
          if (size1 === 0 && size2 === 0) {
            // End of file reached
            return true;
          } else if (lines1.length !== lines2.length) {
            return false;
          } else {
            if (!compareLines(lines1, lines2, options)) {
              return false;
            }
            last1 = lines1[lines1.length - 1];
            last2 = lines2[lines2.length - 1];
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

function removeLineEnding(str: string) {
  return str.replace(/[\r]+$/g, "");
}

// remove white spaces except line endings
function removeWhiteSpaces(str: string) {
  return str.replace(
    /^[ \f\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+|[ \f\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+$/g,
    ""
  );
}

function compareLines(lines1: string[], lines2: string[], options: Options) {
  for (var i = 0; i < lines1.length - 1; i++) {
    var line1 = lines1[i];
    var line2 = lines2[i];
    if (options.ignoreLineEnding) {
      line1 = removeLineEnding(line1);
      line2 = removeLineEnding(line2);
    }
    if (options.ignoreWhiteSpaces) {
      line1 = removeWhiteSpaces(line1);
      line2 = removeWhiteSpaces(line2);
    }
    if (line1 !== line2) {
      return false;
    }
  }
  return true;
}
