"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var Queue_1 = __importDefault(require("./Queue"));
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
var FileDescriptorQueue = /** @class */ (function () {
    function FileDescriptorQueue(maxFilesNo) {
        this.pendingJobs = new Queue_1.default();
        this.activeCount = 0;
        this.maxFilesNo = maxFilesNo;
    }
    FileDescriptorQueue.prototype.process = function () {
        if (this.pendingJobs.getLength() > 0 && this.activeCount < this.maxFilesNo) {
            var job = this.pendingJobs.dequeue();
            this.activeCount++;
            fs_1.default.open(job.path, job.flags, job.callback);
        }
    };
    FileDescriptorQueue.prototype.open = function (item) {
        this.pendingJobs.enqueue(item);
        this.process();
    };
    FileDescriptorQueue.prototype.close = function (fd, callback) {
        this.activeCount--;
        fs_1.default.close(fd, callback);
        this.process();
    };
    return FileDescriptorQueue;
}());
exports.default = FileDescriptorQueue;
//# sourceMappingURL=FileDescriptorQueue.js.map