/**
 * Collection of buffers to be shared between async processes.
 * Avoids allocating buffers each time async process starts.
 * bufSize - size of each buffer
 * bufNo - number of buffers
 * Caller has to make sure no more than bufNo async processes run simultaneously.
 */

export interface BufferPoolEntry {
  buf1: Buffer;
  buf2: Buffer;
  busy: Boolean;
}

export default class BufferPool {
  bufferPool: BufferPoolEntry[];

  constructor(size: number, count: number) {
    this.bufferPool = [];

    // TODO: why was it originially wrapped in a function? That doesn't make
    // sense
    var createAsyncBuffers = () => {
      for (var i = 0; i < count; i++) {
        this.bufferPool.push({
          buf1: Buffer.alloc(size),
          buf2: Buffer.alloc(size),
          busy: false
        });
      }
    };
    createAsyncBuffers();
  }

  allocateBuffers() {
    for (var i = 0, l = this.bufferPool.length; i < l; i++) {
      const bufferPair = this.bufferPool[i];
      if (!bufferPair.busy) {
        bufferPair.busy = true;
        return bufferPair;
      }
    }
    throw new Error("Async buffer limit reached");
  }

  static freeBuffers(bufferPair: BufferPoolEntry) {
    bufferPair.busy = false;
  }
}