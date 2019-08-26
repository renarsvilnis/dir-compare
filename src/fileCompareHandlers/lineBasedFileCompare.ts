/**
 * Compare files line by line with options to ignore
 * line endings and white space differencies.
 */
import { Stats } from "fs";
import Promise from "bluebird";
import FileDescriptorQueue from "../utils/FileDescriptorQueue";
import BufferPool from "../utils/BufferPool";
import { closeFilesAsync } from "./common";
import { BufferPoolEntry } from "../utils/BufferPool";

const MAX_CONCURRENT_FILE_COMPARE = 8;
const BUF_SIZE = 100000;
const fdQueue = new FileDescriptorQueue(MAX_CONCURRENT_FILE_COMPARE * 2);
const wrapper = require("./common").wrapper(fdQueue);
const bufferPool = new BufferPool(BUF_SIZE, MAX_CONCURRENT_FILE_COMPARE); // fdQueue guarantees there will be no more than MAX_CONCURRENT_FILE_COMPARE async processes accessing the buffers concurrently

export interface LineBasedFileCompareOptions {
  ignoreLineEnding: boolean;
  ignoreWhiteSpaces: boolean;
}

export default function lineBasedFileCompare(
  path1: string,
  stat1: Stats,
  path2: string,
  stat2: Stats,
  options: LineBasedFileCompareOptions
) {
  let fd1: number;
  let fd2: number;
  let bufferPair: BufferPoolEntry | undefined;
  return Promise.all([wrapper.open(path1, "r"), wrapper.open(path2, "r")])
    .then(function(fds) {
      bufferPair = bufferPool.allocateBuffers();
      fd1 = fds[0];
      fd2 = fds[1];
      const buf1 = bufferPair.buf1;
      const buf2 = bufferPair.buf2;
      // let progress = 0;
      let last1 = "";
      let last2 = "";
      const compareAsyncInternal = (): Promise<boolean> => {
        return Promise.all([
          wrapper.read(fd1, buf1, 0, BUF_SIZE, null),
          wrapper.read(fd2, buf2, 0, BUF_SIZE, null)
        ]).then(sizes => {
          const size1 = sizes[0];
          const size2 = sizes[1];
          const chunk1 = buf1.toString("utf8", 0, size1);
          const chunk2 = buf2.toString("utf8", 0, size2);
          const lines1 = (last1 + chunk1).split(/\n/);
          const lines2 = (last2 + chunk2).split(/\n/);
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

function compareLines(lines1: string[], lines2: string[], options: LineBasedFileCompareOptions) {
  for (let i = 0; i < lines1.length - 1; i++) {
    let line1 = lines1[i];
    let line2 = lines2[i];
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
