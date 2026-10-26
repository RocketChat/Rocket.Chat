import { Agenda } from './Agenda';
import type { Job } from './Job';
import type { JobDefinition } from './definition/JobDefinition';

type AgendaInternals = {
	_definitions: Record<string, JobDefinition>;
	_jobQueue: { push: (job: Job) => void };
	_lockedJobs: Job[];
	_processInterval: NodeJS.Timeout | undefined;
	_runningJobs: Job[];
	_jobProcessing: jest.Mock<void>;
	_processJobResult: (error: Error | null, job: Job) => void;
	_runOrRetry: () => Promise<void>;
};

const makeRunningJob = () => {
	const agenda = new Agenda() as Agenda & AgendaInternals;
	agenda.define('test-job', jest.fn());

	const job = agenda.create('test-job');
	agenda._runningJobs.push(job);
	agenda._lockedJobs.push(job);
	agenda._definitions['test-job'].running = 1;
	agenda._definitions['test-job'].locked = 1;
	agenda._jobProcessing = jest.fn();

	return { agenda, job };
};

describe('Agenda', () => {
	describe('_processJobResult', () => {
		it('releases scheduler bookkeeping when a job run rejects', () => {
			const { agenda, job } = makeRunningJob();
			const error = new Error('failed to persist running state');
			const errorListener = jest.fn();
			agenda.on('error', errorListener);

			agenda._processJobResult(error, job);

			expect(agenda._runningJobs).not.toContain(job);
			expect(agenda._lockedJobs).not.toContain(job);
			expect(agenda._definitions['test-job'].running).toBe(0);
			expect(agenda._definitions['test-job'].locked).toBe(0);
			expect(errorListener).toHaveBeenCalledWith(error);
			expect(agenda._jobProcessing).toHaveBeenCalledTimes(1);
		});

		it('continues scheduler processing when emitting an unhandled error throws', () => {
			const { agenda, job } = makeRunningJob();
			const error = new Error('failed to persist running state');

			expect(() => agenda._processJobResult(error, job)).toThrow('Unhandled error');

			expect(agenda._runningJobs).not.toContain(job);
			expect(agenda._lockedJobs).not.toContain(job);
			expect(agenda._definitions['test-job'].running).toBe(0);
			expect(agenda._definitions['test-job'].locked).toBe(0);
			expect(agenda._jobProcessing).toHaveBeenCalledTimes(1);
		});
	});

	describe('_runOrRetry', () => {
		it('handles errors thrown while processing a rejected run', async () => {
			const { agenda, job } = makeRunningJob();
			const error = new Error('failed to persist running state');
			jest.spyOn(job, 'run').mockRejectedValue(error);
			agenda._runningJobs.length = 0;
			agenda._definitions['test-job'].running = 0;
			agenda._jobQueue.push(job);
			agenda._processInterval = {} as NodeJS.Timeout;

			await expect(agenda._runOrRetry()).resolves.toBeUndefined();

			expect(agenda._runningJobs).not.toContain(job);
			expect(agenda._lockedJobs).not.toContain(job);
			expect(agenda._definitions['test-job'].running).toBe(0);
			expect(agenda._definitions['test-job'].locked).toBe(0);
			expect(agenda._jobProcessing).toHaveBeenCalledTimes(1);
		});
	});
});
