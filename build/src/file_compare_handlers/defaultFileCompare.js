"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var buffer_equal_1 = __importDefault(require("buffer-equal"));
var bluebird_1 = __importDefault(require("bluebird"));
var FileDescriptorQueue_1 = __importDefault(require("../utils/FileDescriptorQueue"));
var common_1 = require("./common");
var BufferPool_1 = __importDefault(require("../utils/BufferPool"));
var MAX_CONCURRENT_FILE_COMPARE = 8;
var BUF_SIZE = 100000;
var fdQueue = new FileDescriptorQueue_1.default(MAX_CONCURRENT_FILE_COMPARE * 2);
var wrapper = require("./common").wrapper(fdQueue);
var bufferPool = new BufferPool_1.default(BUF_SIZE, MAX_CONCURRENT_FILE_COMPARE); // fdQueue guarantees there will be no more than MAX_CONCURRENT_FILE_COMPARE async processes accessing the buffers concurrently
/**
 * Compares two files by content
 */
function defaultFileCompare(path1, stat1, path2, stat2, options) {
    var fd1;
    var fd2;
    var bufferPair;
    return bluebird_1.default.all([wrapper.open(path1, "r"), wrapper.open(path2, "r")])
        .then(function (fds) {
        bufferPair = bufferPool.allocateBuffers();
        fd1 = fds[0];
        fd2 = fds[1];
        var buf1 = bufferPair.buf1;
        var buf2 = bufferPair.buf2;
        // let progress = 0;
        var compareAsyncInternal = function () {
            return bluebird_1.default.all([
                wrapper.read(fd1, buf1, 0, BUF_SIZE, null),
                wrapper.read(fd2, buf2, 0, BUF_SIZE, null)
            ]).then(function (bufferSizes) {
                var size1 = bufferSizes[0];
                var size2 = bufferSizes[1];
                if (size1 !== size2) {
                    return false;
                }
                else if (size1 === 0) {
                    // End of file reached
                    return true;
                }
                else if (!compareBuffers(buf1, buf2, size1)) {
                    return false;
                }
                else {
                    return compareAsyncInternal();
                }
            });
        };
        return compareAsyncInternal();
    })
        .finally(function () {
        common_1.closeFilesAsync(fd1, fd2, fdQueue);
        if (bufferPair) {
            BufferPool_1.default.freeBuffers(bufferPair);
        }
    });
}
exports.defaultFileCompare = defaultFileCompare;
/**
 * Compares two partial buffers.
 */
function compareBuffers(buf1, buf2, contentSize) {
    return buffer_equal_1.default(buf1.slice(0, contentSize), buf2.slice(0, contentSize));
}
//# sourceMappingURL=defaultFileCompare.js.map