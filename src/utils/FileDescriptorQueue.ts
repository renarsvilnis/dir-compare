import fs from 'fs';
import { promisify } from 'util';

import Queue from './Queue';

// const fsOpenAsync = promisify(fs.open);
const fsCloseAsync = promisify(fs.close);

const MAX_FILE_DESCRIPTOR_QUEUE_LENGTH = 10000;

export interface FileDescriptorQueueItem {
    path: string;
    flags: string | number;
    callback: (err: NodeJS.ErrnoException | null, fd: number) => void;
}

/**
 * Limits the number of concurrent file handlers.
 * Use it as a wrapper over fs.open() and fs.close().
 * Example:
 *  const fdQueue = new FileDescriptorQueue(8);
 *  fdQueue.open(path, flags, (err, fd) =>{
 *    ...
 *    fdQueue.close(fd, (err) =>{
 *      ...
 *    });
 *  });
 *  As of node v7, calling fd.close without a callback is deprecated.
 */
export default class FileDescriptorQueue {
    private pendingJobs = new Queue<FileDescriptorQueueItem>(MAX_FILE_DESCRIPTOR_QUEUE_LENGTH);
    private activeCount = 0;
    private maxFilesNo: number;

    constructor(maxFilesNo: number) {
        this.maxFilesNo = maxFilesNo;
    }

    private process(): void {
        if (this.pendingJobs.getLength() > 0 && this.activeCount < this.maxFilesNo) {
            const job = this.pendingJobs.dequeue();

            if (job) {
                this.activeCount++;
                fs.open(job.path, job.flags, job.callback);
            }
        }
    }

    public open(path: string, flags: string | number): Promise<number> {
        return new Promise((resolve, reject) => {
            this.pendingJobs.enqueue({
                path,
                flags,
                callback: (err, fd) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(fd);
                    }
                },
            });

            // Try to process this item or I queue already full, process other results
            this.process();
        });
    }

    public async close(fd: number): Promise<void> {
        this.activeCount--;
        await fsCloseAsync(fd);
        // Process next queue items
        this.process();
    }
}
