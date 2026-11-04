/** An unbounded async iterable that an adapter pushes viewer events into. */
export class EventQueue {
	items = [];

	waiters = [];

	done = false;

	push(item) {
		const waiter = this.waiters.shift();
		waiter ? waiter({ value: item, done: false }) : this.items.push(item);
	}

	end() {
		this.done = true;
		this.waiters.splice(0).forEach((waiter) => waiter({ value: undefined, done: true }));
	}

	[Symbol.asyncIterator]() {
		return {
			next: () => {
				if (this.items.length) {
					return Promise.resolve({ value: this.items.shift(), done: false });
				}
				if (this.done) {
					return Promise.resolve({ value: undefined, done: true });
				}
				return new Promise((resolve) => this.waiters.push(resolve));
			},
		};
	}
}
