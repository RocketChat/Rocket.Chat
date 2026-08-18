/**
 * A queue of ddp blocking methods that are waiting to be sent to the server.
 */

import { MinimalDDPClient } from './MinimalDDPClient';
import type { OutgoingPayload } from './types/OutgoingPayload';
import type { MethodPayload } from './types/methodsPayloads';

type Blocks = {
	wait: boolean;
	items: MethodPayload[];
};

type Queue = Blocks[];

export class DDPDispatcher extends MinimalDDPClient {
	queue: Queue = [];

	override dispatch(payload: OutgoingPayload, options?: { wait?: boolean }) {
		// Only method payloads participate in the wait/queue serialization that
		// implements Meteor's wait-method semantics. Protocol-level frames
		// (connect, sub, unsub, ping, pong) must be delivered immediately:
		// queueing a `connect` frame behind a wait `login` block, for example,
		// wedges the DDP handshake — the socket opens but `connect` never
		// reaches the server, so the server never replies `connected` and the
		// session never establishes.
		if (payload.msg !== 'method') {
			this.emit('send', payload);
			return;
		}

		if (options?.wait) {
			this.wait(payload);
			return;
		}

		this.pushItem(payload);
	}

	wait(block: MethodPayload) {
		this.queue.push({
			wait: true,
			items: [block],
		});

		if (this.queue.length === 1) {
			this.sendOutstandingBlocks();
		}
	}

	private pushItem(item: MethodPayload) {
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

		block.items.forEach((payload) => {
			this.emit('send', payload);
		});

		if (block.wait) {
			return;
		}

		this.queue.shift();
		this.sendOutstandingBlocks();
	}

	removeItem(item: MethodPayload) {
		const block = this.queue[0];

		if (!block) {
			return;
			// throw new Error('No block to remove item from');
		}

		const index = block.items.indexOf(item);

		if (index === -1) {
			return;
			// throw new Error('Item not found in block');
		}

		block.items.splice(index, 1);

		if (block.items.length === 0) {
			this.queue.shift();
			this.sendOutstandingBlocks();
		}
	}
}
