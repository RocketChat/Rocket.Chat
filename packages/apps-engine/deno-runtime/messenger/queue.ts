import * as jsonrpc from "jsonrpc-lite";

import { encoder } from '../lib/codec.ts';
import { Transport } from "./transporter.ts";
import { COMMAND_PONG } from "./mod.ts";

export const Queue = new (class Queue {
    private queue: Uint8Array[] = [];
    private isProcessing = false;

    private async processQueue() {
        if (this.isProcessing) {
            return;
        }

        this.isProcessing = true;

        while (this.queue.length) {
            const message = this.queue.shift();

            if (message) {
                await Transport.send(message);
            }
        }

        this.isProcessing = false;
    }

    public enqueue(message: jsonrpc.JsonRpc | typeof COMMAND_PONG) {
        this.queue.push(encoder.encode(message));
        this.processQueue();
    }

    public getCurrentSize() {
        return this.queue.length;
    }
});

