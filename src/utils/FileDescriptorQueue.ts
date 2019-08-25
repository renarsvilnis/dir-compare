import fs from "fs";

import Queue from "./Queue";

export interface FileDescriptorQueueItem {
  path: string;
  flags: string | number;
  callback: (err: NodeJS.ErrnoException | null, fd: number) => void;
}

/**
 * Limits the number of concurrent file handlers.
 * Use it as a wrapper over fs.open() and fs.close().
 * Example:
 *  var fdQueue = new FileDescriptorQueue(8);
 *  fdQueue.open(path, flags, (err, fd) =>{
 *    ...
 *    fdQueue.close(fd, (err) =>{
 *      ...
 *    });
 *  });
 *  As of node v7, calling fd.close without a callback is deprecated.
 */
export default class FileDescriptorQueue {
  pendingJobs = new Queue<FileDescriptorQueueItem>();
  activeCount = 0;
  maxFilesNo: number;

  constructor(maxFilesNo: number) {
    this.maxFilesNo = maxFilesNo;
  }

  private process() {
    if (this.pendingJobs.getLength() > 0 && this.activeCount < this.maxFilesNo) {
      const job = this.pendingJobs.dequeue()!;
      this.activeCount++;
      fs.open(job.path, job.flags, job.callback);
    }
  }

  public open(item: FileDescriptorQueueItem) {
    this.pendingJobs.enqueue(item);
    this.process();
  }

  public close(fd: number, callback: (err: NodeJS.ErrnoException | null) => void) {
    this.activeCount--;
    fs.close(fd, callback);
    this.process();
  }
}
