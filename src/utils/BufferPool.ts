export interface BufferPoolEntry {
    buf1: Buffer;
    buf2: Buffer;
    busy: boolean;
}

/**
 * Collection of buffers to be shared between async processes.
 * Avoids allocating buffers each time async process starts.
 *
 * Caller has to make sure no more than buffer count async processes run simultaneously.
 */
export default class BufferPool {
    bufferPool: BufferPoolEntry[];

    constructor(bufferSize: number, bufferCount: number) {
        this.bufferPool = [];

        // TODO: why was it originally wrapped in a function? That doesn't make
        // sense
        const createAsyncBuffers = (): void => {
            for (let i = 0; i < bufferCount; i++) {
                this.bufferPool.push({
                    buf1: Buffer.alloc(bufferSize),
                    buf2: Buffer.alloc(bufferSize),
                    busy: false,
                });
            }
        };
        createAsyncBuffers();
    }

    allocateBuffers(): BufferPoolEntry {
        for (let i = 0, l = this.bufferPool.length; i < l; i++) {
            const bufferPair = this.bufferPool[i];
            if (!bufferPair.busy) {
                bufferPair.busy = true;
                return bufferPair;
            }
        }
        throw new Error('Async buffer limit reached');
    }

    static freeBuffers(bufferPair: BufferPoolEntry): void {
        bufferPair.busy = false;
    }
}
