"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A first-in-first-out (FIFO) data structure - items are added to the end of the queue and removed from the front.
 */
var Queue = /** @class */ (function () {
    function Queue(maxUnusedArraySize) {
        if (maxUnusedArraySize === void 0) { maxUnusedArraySize = 10000; }
        // initialise the queue and offset
        this.queue = [];
        this.offset = 0;
        this.maxUnusedArraySize = maxUnusedArraySize;
    }
    // TODO: maybe remove?
    // Returns the length of the queue.
    Queue.prototype.getLength = function () {
        return this.queue.length - this.offset;
    };
    /* Enqueues the specified item. The parameter is:
     *
     * item - the item to enqueue
     */
    Queue.prototype.enqueue = function (item) {
        this.queue.push(item);
    };
    /* Dequeues an item and returns it. If the queue is empty, the value
     * 'undefined' is returned.
     */
    Queue.prototype.dequeue = function () {
        // if the queue is empty, return immediately
        if (this.queue.length == 0)
            return undefined;
        // store the item at the front of the queue
        var item = this.queue[this.offset];
        // increment the offset and remove the free space if necessary
        if (++this.offset > this.maxUnusedArraySize) {
            this.queue = this.queue.slice(this.offset);
            this.offset = 0;
        }
        // return the dequeued item
        return item;
    };
    return Queue;
}());
exports.default = Queue;
//# sourceMappingURL=Queue.js.map