import { EventEmitter } from 'node:events';

import type { Agenda } from './Agenda';
import { Job } from './Job';
import type { JobDefinition } from './definition/JobDefinition';

const makeAgenda = (saveJob: jest.Mock<Promise<void>>, fn: JobDefinition['fn'] = jest.fn(async () => undefined)) => {
	const agenda = new EventEmitter() as Agenda;

	agenda.getDefinition = jest.fn(() => ({
		concurrency: 1,
		lockLimit: 0,
		priority: 0,
		lockLifetime: 10_000,
		fn,
		running: 0,
		locked: 0,
	}));
	agenda.saveJob = saveJob;

	return agenda;
};

describe('Job', () => {
	describe('run', () => {
		it('rejects when persisting the initial running state fails', async () => {
			const error = new Error('failed to persist running state');
			const processor = jest.fn(async () => undefined);
			const agenda = makeAgenda(jest.fn().mockRejectedValue(error), processor);
			const job = new Job({ agenda, name: 'test-job' });

			await expect(job.run()).rejects.toBe(error);
			expect(processor).not.toHaveBeenCalled();
		});

		it('runs promise-based jobs after persisting their running state', async () => {
			const saveJob = jest.fn().mockResolvedValue(undefined);
			const processor = jest.fn(async () => undefined);
			const agenda = makeAgenda(saveJob, processor);
			const job = new Job({ agenda, name: 'test-job' });

			await expect(job.run()).resolves.toBe(job);
			expect(processor).toHaveBeenCalledWith(job);
			expect(saveJob).toHaveBeenCalledTimes(2);
		});

		it('retains callback-based job completion', async () => {
			const saveJob = jest.fn().mockResolvedValue(undefined);
			const processor = jest.fn(async (_job: Job, callback?: (error?: Error) => Promise<void>) => callback?.());
			const agenda = makeAgenda(saveJob, processor);
			const job = new Job({ agenda, name: 'test-job' });

			await expect(job.run()).resolves.toBe(job);
			expect(processor).toHaveBeenCalledWith(job, expect.any(Function));
			expect(saveJob).toHaveBeenCalledTimes(2);
		});
	});
});
