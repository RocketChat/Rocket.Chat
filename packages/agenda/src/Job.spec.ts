import type { Agenda } from './Agenda';
import { Job } from './Job';

const createJob = (repeatInterval: string | number, lastRunAt?: Date) =>
	new Job({ agenda: {} as Agenda, name: 'test-job', type: 'single', repeatInterval, lastRunAt });

describe('Job.computeNextRunAt', () => {
	const lastRunAt = new Date(2026, 10, 1, 10, 0, 0);

	it.each(['0 0 1 12 *', '*/0 * * * *', 'not an interval'])('should fail the job instead of scheduling it again for %s', (interval) => {
		const job = createJob(interval, lastRunAt).computeNextRunAt();

		expect(job.attrs.nextRunAt).toBeNull();
		expect(job.attrs.failReason).toBe('failed to calculate nextRunAt due to invalid repeat interval');
		expect(job.attrs.failCount).toBe(1);
	});

	it('should fail the job for a negative interval', () => {
		const job = createJob(-60000, lastRunAt).computeNextRunAt();

		expect(job.attrs.nextRunAt).toBeNull();
		expect(job.attrs.failCount).toBe(1);
	});

	it('should schedule a valid cron expression', () => {
		const job = createJob('0 0 1 11 *', lastRunAt).computeNextRunAt();

		expect(job.attrs.nextRunAt).toEqual(new Date(2026, 11, 1, 0, 0, 0));
		expect(job.attrs.failReason).toBeUndefined();
	});

	it('should schedule a human interval after the last run', () => {
		const job = createJob('5 minutes', lastRunAt).computeNextRunAt();

		expect(job.attrs.nextRunAt).toEqual(new Date(lastRunAt.getTime() + 5 * 60 * 1000));
		expect(job.attrs.failReason).toBeUndefined();
	});

	it('should schedule an interval in milliseconds after the last run', () => {
		const job = createJob(60000, lastRunAt).computeNextRunAt();

		expect(job.attrs.nextRunAt).toEqual(new Date(lastRunAt.getTime() + 60000));
		expect(job.attrs.failReason).toBeUndefined();
	});

	it('should run a new job with a human interval right away', () => {
		const before = Date.now();
		const job = createJob('5 minutes').computeNextRunAt();

		expect(job.attrs.nextRunAt?.getTime()).toBeGreaterThanOrEqual(before);
		expect(job.attrs.nextRunAt?.getTime()).toBeLessThanOrEqual(Date.now());
	});
});

describe('Job.repeatEvery', () => {
	it('should fail a new job with an invalid cron expression instead of making it due', () => {
		const job = createJob('0 0 1 12 *');
		job.attrs.nextRunAt = null;

		job.repeatEvery('0 0 1 12 *');

		expect(job.attrs.nextRunAt).toBeNull();
		expect(job.attrs.failCount).toBe(1);
	});

	it('should fail a new job with an invalid cron expression when skipping the immediate run', () => {
		const job = createJob('0 0 1 12 *');

		job.repeatEvery('0 0 1 12 *', { skipImmediate: true });

		expect(job.attrs.nextRunAt).toBeNull();
		expect(job.attrs.failCount).toBe(1);
	});
});
