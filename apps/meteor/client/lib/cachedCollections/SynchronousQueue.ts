// An even simpler queue of tasks than the fiber-enabled one.  This one just
// runs all the tasks when you call runTask or flush, synchronously.
export class SynchronousQueue {
	private tasks: (() => void)[] = [];

	private running = false;

	private runTimeout: ReturnType<typeof setTimeout> | null = null;

	runTask(task: () => void) {
		if (!this.safeToRunTask()) throw new Error('Could not synchronously run a task from a running task');

		this.tasks.push(task);
		const { tasks } = this;
		this.tasks = [];
		this.running = true;

		if (this.runTimeout) {
			// Since we're going to drain the queue, we can forget about the timeout
			// which tries to run it.  (But if one of our tasks queues something else,
			// the timeout will be correctly re-created.)
			clearTimeout(this.runTimeout);
			this.runTimeout = null;
		}

		try {
			for (;;) {
				const t = tasks.shift();

				if (!t) break;

				try {
					t();
				} catch (e) {
					if (tasks.length === 0) {
						// this was the last task, that is, the one we're calling runTask for.
						throw e;
					}
					console.log('Exception in queued task', e);
				}
			}
		} finally {
			this.running = false;
		}
	}

	queueTask(task: () => void) {
		this.tasks.push(task);
		// Intentionally not using Meteor.setTimeout, because it doesn't like runing
		// in stubs for now.
		if (!this.runTimeout) {
			this.runTimeout = setTimeout((...args) => this.flush(...args), 0);
		}
	}

	flush() {
		this.runTask(() => undefined);
	}

	drain() {
		if (!this.safeToRunTask()) return;

		while (this.tasks.length > 0) {
			this.flush();
		}
	}

	private safeToRunTask() {
		return !this.running;
	}
}
