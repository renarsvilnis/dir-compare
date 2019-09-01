/**
 * A first-in-first-out (FIFO) data structure - items are added to the end of the queue and removed from the front.
 */
export default class Queue<Item> {
  // initialise the queue and offset
  queue: Item[] = [];
  offset: number = 0;
  maxUnusedArraySize: number;

  constructor(maxUnusedArraySize: number) {
    // TODO: does maxUnusedArraySize improve performance?
    this.maxUnusedArraySize = maxUnusedArraySize;
  }

  // TODO: maybe remove?
  // Returns the length of the queue.
  getLength(): number {
    return this.queue.length - this.offset;
  }

  /* Enqueues the specified item. The parameter is:
   *
   * item - the item to enqueue
   */
  enqueue(...items: Item[]): void {
    this.queue.push(...items);
  }

  /* Dequeues an item and returns it. If the queue is empty, the value
   * 'undefined' is returned.
   */
  dequeue(): Item | undefined {
    // if the queue is empty, return immediately
    if (this.queue.length == 0) return undefined;

    // store the item at the front of the queue
    const item = this.queue[this.offset];

    // increment the offset and remove the free space if necessary
    if (++this.offset > this.maxUnusedArraySize) {
      this.queue = this.queue.slice(this.offset);
      this.offset = 0;
    }

    // return the dequeued item
    return item;
  }
}
