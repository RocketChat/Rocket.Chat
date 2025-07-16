export class SynchronousQueue {
	private tasks: (() => void)[] = [];

	private running = false;

	private runTimeout: ReturnType<typeof setTimeout> | null = null;

	private runTask(task: () => void) {
		if (!this.safeToRunTask()) throw new Error('Could not synchronously run a task from a running task');

		this.tasks.push(task);
		const { tasks } = this;
		this.tasks = [];
		this.running = true;

		if (this.runTimeout) {
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

		if (!this.runTimeout) {
			this.runTimeout = setTimeout((...args) => this.flush(...args), 0);
		}
	}

	private flush() {
		this.runTask(() => undefined);
	}

	async drain(): Promise<void> {
		if (!this.safeToRunTask()) return;

		while (this.tasks.length > 0) {
			this.flush();
		}
	}

	private safeToRunTask() {
		return !this.running;
	}
}
