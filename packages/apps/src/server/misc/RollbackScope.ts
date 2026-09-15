type RollbackStep = {
	name: string;
	undo: () => Promise<void>;
};

/**
 * Collects the compensation steps of an operation that spans several stores.
 *
 * Register a step right after the effect it compensates. Call `commit()` when the
 * operation succeeds, and call `unwind()` from a `finally` block. A committed scope
 * does nothing, so every early return and every throw cleans up by default.
 *
 * The scope runs the steps in reverse order, one at a time. A failed step never stops
 * the other steps, and it never replaces the error that started the rollback.
 */
export class RollbackScope {
	private readonly steps: Array<RollbackStep> = [];

	private committed = false;

	constructor(private readonly description: string) {}

	/**
	 * Registers a compensation step.
	 *
	 * @param name identifies the step in the error report
	 * @param undo reverts the effect. It must tolerate a partial effect.
	 */
	public defer(name: string, undo: () => Promise<void>): void {
		if (this.committed) {
			throw new Error(`Can not add the step "${name}" to a committed rollback scope`);
		}

		this.steps.push({ name, undo });
	}

	/** Disarms the scope. After this call `unwind()` does nothing. */
	public commit(): void {
		this.committed = true;
	}

	/**
	 * Runs every pending step in reverse order, unless the scope is committed.
	 *
	 * The scope reports the failed steps as a single AggregateError. It never throws.
	 */
	public async unwind(): Promise<void> {
		if (this.committed) {
			return;
		}

		// Take the steps out of the scope so that a second call does nothing
		const steps = this.steps.splice(0).reverse();
		const errors: Array<Error> = [];

		for (const { name, undo } of steps) {
			try {
				await undo();
			} catch (error) {
				errors.push(new Error(`Rollback step "${name}" failed`, { cause: error }));
			}
		}

		if (errors.length) {
			console.error(new AggregateError(errors, `${this.description}: the rollback did not complete`));
		}
	}
}
