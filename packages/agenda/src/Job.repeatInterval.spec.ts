import type { Agenda } from './Agenda';
import { Job } from './Job';

const INVALID_INTERVAL = 'failed to calculate nextRunAt due to invalid repeat interval';

const createJob = (repeatInterval: string | number, lastRunAt?: Date) =>
	new Job({ agenda: {} as Agenda, name: 'test-job', type: 'single', repeatInterval, lastRunAt });

describe('Job.computeNextRunAt', () => {
	const lastRunAt = new Date(2026, 10, 1, 10, 0, 0);

	it.each<string | number>(['0 0 1 12 *', '*/0 * * * *', 'not an interval', '0 seconds', '0.0001 seconds', -60000, 0.5, 0.9, 0.999])(
		'should fail the job instead of scheduling it again for %p',
		(interval) => {
			const job = createJob(interval, lastRunAt).computeNextRunAt();

			expect(job.attrs.nextRunAt).toBeNull();
			expect(job.attrs.failReason).toBe(INVALID_INTERVAL);
			expect(job.attrs.failCount).toBe(1);
		},
	);

	it.each([
		[1, 1],
		[1.5, 1],
		[5, 5],
		[60000, 60000],
		['5 minutes', 5 * 60 * 1000],
	])('should schedule the interval %p %pms after the last run', (interval, advance) => {
		const job = createJob(interval, lastRunAt).computeNextRunAt();

		expect(job.attrs.nextRunAt).toEqual(new Date(lastRunAt.getTime() + advance));
		expect(job.attrs.failReason).toBeUndefined();
	});

	it('should schedule a valid cron expression', () => {
		const job = createJob('0 0 1 * *', lastRunAt).computeNextRunAt();

		expect(job.attrs.nextRunAt).toEqual(new Date(2026, 11, 1, 0, 0, 0));
		expect(job.attrs.failReason).toBeUndefined();
	});

	it('should not repeat a job with a numeric interval of 0', () => {
		const job = createJob(0, lastRunAt).computeNextRunAt();

		expect(job.attrs.nextRunAt).toBeNull();
		expect(job.attrs.failReason).toBeUndefined();
	});

	it('should run a new job with a human interval right away', () => {
		const before = Date.now();
		const job = createJob('5 minutes').computeNextRunAt();

		expect(job.attrs.nextRunAt?.getTime()).toBeGreaterThanOrEqual(before);
		expect(job.attrs.nextRunAt?.getTime()).toBeLessThanOrEqual(Date.now());
		expect(job.attrs.failReason).toBeUndefined();
	});
});

describe('Job.repeatEvery', () => {
	it.each([{}, { skipImmediate: true }])('should fail a new job with an invalid cron expression (%p)', (options) => {
		const job = new Job({ agenda: {} as Agenda, name: 'test-job', type: 'single' });

		job.repeatEvery('0 0 1 12 *', options);

		expect(job.attrs.nextRunAt).toBeNull();
		expect(job.attrs.failReason).toBe(INVALID_INTERVAL);
	});
});
