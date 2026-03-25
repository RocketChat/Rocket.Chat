import { AsyncTest, Expect, SetupFixture } from 'alsatian';

import type { IOnetimeSchedule, IRecurringSchedule } from '../../../src/definition/scheduler';
import { SchedulerModify } from '../../../src/server/accessors';
import type { SchedulerBridge } from '../../../src/server/bridges';

export class SchedulerModifyAccessorTestFixture {
	private mockSchedulerBridge: SchedulerBridge;

	private scheduleOnceCalls: Array<{ job: IOnetimeSchedule; appId: string }>;

	private scheduleRecurringCalls: Array<{ job: IRecurringSchedule; appId: string }>;

	private cancelJobCalls: Array<{ jobId: string; appId: string }>;

	private cancelAllJobsCalls: string[];

	@SetupFixture
	public setupFixture(): void {
		this.scheduleOnceCalls = [];
		this.scheduleRecurringCalls = [];
		this.cancelJobCalls = [];
		this.cancelAllJobsCalls = [];

		const { scheduleOnceCalls, scheduleRecurringCalls, cancelJobCalls, cancelAllJobsCalls } = this;

		this.mockSchedulerBridge = {
			doScheduleOnce(job: IOnetimeSchedule, appId: string): Promise<void> {
				scheduleOnceCalls.push({ job, appId });
				return Promise.resolve();
			},
			doScheduleRecurring(job: IRecurringSchedule, appId: string): Promise<void> {
				scheduleRecurringCalls.push({ job, appId });
				return Promise.resolve();
			},
			doCancelJob(jobId: string, appId: string): Promise<void> {
				cancelJobCalls.push({ jobId, appId });
				return Promise.resolve();
			},
			doCancelAllJobs(appId: string): Promise<void> {
				cancelAllJobsCalls.push(appId);
				return Promise.resolve();
			},
		} as SchedulerBridge;
	}

	@AsyncTest()
	public async scheduleOnceAppendsAppIdWhenMissing(): Promise<void> {
		const scheduler = new SchedulerModify(this.mockSchedulerBridge, 'test-app');
		const job: IOnetimeSchedule = {
			id: 'job-1',
			when: new Date('2026-03-24T12:00:00.000Z'),
			data: { pollId: '123' },
		};

		await Expect(() => scheduler.scheduleOnce(job)).not.toThrowAsync();

		Expect(this.scheduleOnceCalls.length).toBe(1);
		Expect(this.scheduleOnceCalls[0].appId).toBe('test-app');
		Expect(this.scheduleOnceCalls[0].job).toEqual({
			...job,
			id: 'job-1_test-app',
		});
		Expect(job.id).toBe('job-1');
	}

	@AsyncTest()
	public async scheduleOnceDoesNotAppendAppIdTwice(): Promise<void> {
		const scheduler = new SchedulerModify(this.mockSchedulerBridge, 'test-app');
		const job: IOnetimeSchedule = {
			id: 'job-1_test-app',
			when: 'in 5 minutes',
		};

		await scheduler.scheduleOnce(job);

		Expect(this.scheduleOnceCalls.length).toBe(1);
		Expect(this.scheduleOnceCalls[0].job.id).toBe('job-1_test-app');
	}

	@AsyncTest()
	public async scheduleRecurringAppendsAppIdWhenMissing(): Promise<void> {
		const scheduler = new SchedulerModify(this.mockSchedulerBridge, 'test-app');
		const job: IRecurringSchedule = {
			id: 'recurring-1',
			interval: '5 minutes',
			skipImmediate: true,
			data: { roomId: 'abc' },
		};

		await scheduler.scheduleRecurring(job);

		Expect(this.scheduleRecurringCalls.length).toBe(1);
		Expect(this.scheduleRecurringCalls[0].appId).toBe('test-app');
		Expect(this.scheduleRecurringCalls[0].job).toEqual({
			...job,
			id: 'recurring-1_test-app',
		});
		Expect(job.id).toBe('recurring-1');
	}

	@AsyncTest()
	public async cancelJobAppendsAppIdWhenMissing(): Promise<void> {
		const scheduler = new SchedulerModify(this.mockSchedulerBridge, 'test-app');

		await scheduler.cancelJob('cleanup-job');

		Expect(this.cancelJobCalls.length).toBe(1);
		Expect(this.cancelJobCalls[0]).toEqual({
			jobId: 'cleanup-job_test-app',
			appId: 'test-app',
		});
	}

	@AsyncTest()
	public async cancelJobDoesNotAppendAppIdTwice(): Promise<void> {
		const scheduler = new SchedulerModify(this.mockSchedulerBridge, 'test-app');

		await scheduler.cancelJob('cleanup-job_test-app');

		Expect(this.cancelJobCalls.length).toBe(1);
		Expect(this.cancelJobCalls[0]).toEqual({
			jobId: 'cleanup-job_test-app',
			appId: 'test-app',
		});
	}

	@AsyncTest()
	public async cancelAllJobsUsesOnlyAppId(): Promise<void> {
		const scheduler = new SchedulerModify(this.mockSchedulerBridge, 'test-app');

		await scheduler.cancelAllJobs();

		Expect(this.cancelAllJobsCalls.length).toBe(1);
		Expect(this.cancelAllJobsCalls[0]).toBe('test-app');
	}
}
