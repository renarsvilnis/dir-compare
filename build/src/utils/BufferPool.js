"use strict";
/**
 * Collection of buffers to be shared between async processes.
 * Avoids allocating buffers each time async process starts.
 * bufSize - size of each buffer
 * bufNo - number of buffers
 * Caller has to make sure no more than bufNo async processes run simultaneously.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var BufferPool = /** @class */ (function () {
    function BufferPool(size, count) {
        var _this = this;
        this.bufferPool = [];
        // TODO: why was it originially wrapped in a function? That doesn't make
        // sense
        var createAsyncBuffers = function () {
            for (var i = 0; i < count; i++) {
                _this.bufferPool.push({
                    buf1: Buffer.alloc(size),
                    buf2: Buffer.alloc(size),
                    busy: false
                });
            }
        };
        createAsyncBuffers();
    }
    BufferPool.prototype.allocateBuffers = function () {
        for (var i = 0, l = this.bufferPool.length; i < l; i++) {
            var bufferPair = this.bufferPool[i];
            if (!bufferPair.busy) {
                bufferPair.busy = true;
                return bufferPair;
            }
        }
        throw new Error("Async buffer limit reached");
    };
    BufferPool.freeBuffers = function (bufferPair) {
        bufferPair.busy = false;
    };
    return BufferPool;
}());
exports.default = BufferPool;
//# sourceMappingURL=BufferPool.js.map