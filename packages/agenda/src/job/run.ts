import createDebugger from 'debug';

import type { Job } from '.';

const debug = createDebugger('agenda:job');

/**
 * Internal method (RUN)
 * @name Job#run
 * @function
 */
export const run = async function (this: Job): Promise<Job> {
	const { agenda } = this;
	const definition = agenda._definitions[this.attrs.name];

	// @TODO: this lint issue should be looked into: https://eslint.org/docs/rules/no-async-promise-executor
	// eslint-disable-next-line no-async-promise-executor
	return new Promise(async (resolve, reject) => {
		this.attrs.lastRunAt = new Date();
		debug('[%s:%s] setting lastRunAt to: %s', this.attrs.name, this.attrs._id, this.attrs.lastRunAt.toISOString());
		this.computeNextRunAt();
		await this.save();

		let finished = false;
		const jobCallback = async (error?: Error, result?: unknown) => {
			// We don't want to complete the job multiple times
			if (finished) {
				return;
			}

			finished = true;

			if (error) {
				this.fail(error);
			} else {
				this.attrs.lastFinishedAt = new Date();

				if (this.attrs.shouldSaveResult && result) {
					this.attrs.result = result;
				}
			}

			this.attrs.lockedAt = null;

			await this.save().catch((error: Error) => {
				debug('[%s:%s] failed to be saved to MongoDB', this.attrs.name, this.attrs._id);
				reject(error);
			});
			debug('[%s:%s] was saved successfully to MongoDB', this.attrs.name, this.attrs._id);

			if (error) {
				agenda.emit('fail', error, this);
				agenda.emit(`fail:${this.attrs.name}`, error, this);
				debug('[%s:%s] has failed [%s]', this.attrs.name, this.attrs._id, error.message);
			} else {
				agenda.emit('success', this);
				agenda.emit(`success:${this.attrs.name}`, this);
				debug('[%s:%s] has succeeded', this.attrs.name, this.attrs._id);
			}

			agenda.emit('complete', this);
			agenda.emit(`complete:${this.attrs.name}`, this);
			debug('[%s:%s] job finished at [%s] and was unlocked', this.attrs.name, this.attrs._id, this.attrs.lastFinishedAt);
			// Curiously, we still resolve successfully if the job processor failed.
			// Agenda is not equipped to handle errors originating in user code, so, we leave them to inspect the side-effects of job.fail()
			resolve(this);
		};

		try {
			agenda.emit('start', this);
			agenda.emit(`start:${this.attrs.name}`, this);
			debug('[%s:%s] starting job', this.attrs.name, this.attrs._id);
			if (!definition) {
				debug('[%s:%s] has no definition, can not run', this.attrs.name, this.attrs._id);
				throw new Error('Undefined job');
			}

			if (definition.fn.length === 2) {
				debug('[%s:%s] process function being called', this.attrs.name, this.attrs._id);
				await definition.fn(this, jobCallback);
			} else {
				debug('[%s:%s] process function being called', this.attrs.name, this.attrs._id);
				const result = await definition.fn(this);
				await jobCallback(undefined, result);
			}
		} catch (error) {
			debug('[%s:%s] unknown error occurred', this.attrs.name, this.attrs._id);
			await jobCallback(error as Error);
		}
	});
};
