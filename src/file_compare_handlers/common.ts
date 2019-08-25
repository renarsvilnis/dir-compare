import fs from "fs";
import Promise from "bluebird";
import FileDescriptorQueue from "../utils/FileDescriptorQueue";

export function wrapper(fdQueue: FileDescriptorQueue) {
  return {
    open: Promise.promisify(fdQueue.open),
    read: Promise.promisify(fs.read)
  };
}

export function closeFilesAsync(fd1: number | undefined, fd2: number | undefined, fdQueue: FileDescriptorQueue) {
  if (fd1) {
    fdQueue.close(fd1, err => {
      // TODO: what to do?
      if (err) {
        console.log(err);
      }
    });
  }
  if (fd2) {
    fdQueue.close(fd2, err => {
      // TODO: what to do?
      if (err) {
        console.log(err);
      }
    });
  }
}
