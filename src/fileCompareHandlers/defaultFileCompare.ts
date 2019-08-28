import { Stats } from "fs";
import bufferEqual from "buffer-equal";
import fs from "fs";
import { promisify } from "util";

import FileDescriptorQueue from "../utils/FileDescriptorQueue";
import BufferPool, { BufferPoolEntry } from "../utils/BufferPool";

const MAX_CONCURRENT_FILE_COMPARE = 8;
const BUF_SIZE = 100000;
const fdQueue = new FileDescriptorQueue(MAX_CONCURRENT_FILE_COMPARE * 2);

const readAsync = promisify(fs.read);

const bufferPool = new BufferPool(BUF_SIZE, MAX_CONCURRENT_FILE_COMPARE); // fdQueue guarantees there will be no more than MAX_CONCURRENT_FILE_COMPARE async processes accessing the buffers concurrently

/**
 * Compares two files by content
 */
export default function defaultFileCompare(
  path1: string,
  stat1: Stats,
  path2: string,
  stat2: Stats,
  options?: {}
): Promise<boolean> {
  let fd1: number | undefined;
  let fd2: number | undefined;
  let bufferPair: BufferPoolEntry | undefined;

  return Promise.all([fdQueue.open(path1, "r"), fdQueue.open(path2, "r")])
    .then(([fd1, fd2]) => {
      bufferPair = bufferPool.allocateBuffers();
      const buf1 = bufferPair.buf1;
      const buf2 = bufferPair.buf2;
      // let progress = 0;
      const compareAsyncInternal = (): Promise<boolean> => {
        return Promise.all([readAsync(fd1, buf1, 0, BUF_SIZE, null), readAsync(fd2, buf2, 0, BUF_SIZE, null)]).then(
          ([readResult1, readResult2]) => {
            const size1 = readResult1.bytesRead;
            const size2 = readResult2.bytesRead;

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
    .finally(() => {
      // NOTE: don't wait .close() to resolve for results
      fd1 && fdQueue.close(fd1);
      fd2 && fdQueue.close(fd2);

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
