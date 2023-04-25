/**
 * A queue of ddp blocking methods that are waiting to be sent to the server.
 */

import { Emitter } from '@rocket.chat/emitter';

import type { DDPClient } from './types/DDPClient';

type Blocks = {
	wait: boolean;
	items: unknown[];
};

type Queue = Blocks[];

export class DDPDispatcher extends Emitter<{
	dispatch: unknown;
}> {
	queue: Queue = [];

	constructor(readonly ddp: DDPClient) {
		super();

		ddp.onDispatchMessage((msg, options) => {
			if (options?.wait) {
				this.addBlock(msg);
				return;
			}
			this.pushItem(msg);
		});
	}

	addBlock(block: unknown) {
		this.queue.push({
			wait: true,
			items: [block],
		});

		if (this.queue.length === 1) {
			this.sendOutstandingBlocks();
		}
	}

	pushItem(item: unknown) {
		const block = this.tail();
		if (!block || block.wait) {
			this.queue.push({
				wait: false,
				items: [item],
			});
		}
		if (!block) {
			this.sendOutstandingBlocks();
			return;
		}

		if (block.wait) {
			return;
		}

		block.items.push(item);
	}

	private tail() {
		return this.queue[this.queue.length - 1];
	}

	private sendOutstandingBlocks() {
		const block = this.queue[0];

		if (!block) {
			return;
		}

		block.items.forEach((item) => {
			this.emit('dispatch', item);
		});
	}

	removeItem(item: unknown) {
		const block = this.queue[0];

		if (!block) {
			throw new Error('No block to remove item from');
		}

		const index = block.items.indexOf(item);

		if (index === -1) {
			throw new Error('Item not found in block');
		}

		block.items.splice(index, 1);

		if (block.items.length === 0) {
			this.queue.shift();
			this.sendOutstandingBlocks();
		}
	}
}
