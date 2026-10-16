/** Tasks registered while a suite sets up, run in reverse on teardown; one failing task never blocks the others. */
export class Cleanup {
	private readonly tasks: (() => Promise<unknown> | unknown)[] = [];

	add(task: () => Promise<unknown> | unknown): void {
		this.tasks.push(task);
	}

	async run(): Promise<void> {
		for (const task of this.tasks.splice(0).reverse()) {
			try {
				await task();
			} catch (error) {
				console.warn('[cleanup]', error instanceof Error ? error.message : error);
			}
		}
	}
}
