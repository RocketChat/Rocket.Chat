import type { ICronJobItem } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { deriveStatus } from '../../../../../server/services/cron-jobs/deriveStatus';

describe('CronJobs deriveStatus', () => {
	it('should return "disabled" if job.disabled is true', () => {
		const result = deriveStatus({ _id: '1', disabled: true } as ICronJobItem);
		expect(result).to.be.equal('disabled');
	});

	it('should return "running" if job has a fresh lockedAt date', () => {
		const freshLock = new Date(Date.now() - 5 * 60 * 1000);
		const result = deriveStatus({ _id: '1', lockedAt: freshLock } as ICronJobItem);
		expect(result).to.be.equal('running');
	});

	it('should ignore stale locks and fall back to "scheduled" if nextRunAt exists', () => {
		const staleLock = new Date(Date.now() - 15 * 60 * 1000);
		const result = deriveStatus({ _id: '1', lockedAt: staleLock, nextRunAt: new Date() } as ICronJobItem);
		expect(result).to.be.equal('scheduled');
	});

	it('should return "failed" if the job failed more recently than it finished', () => {
		const result = deriveStatus({
			_id: '1',
			failCount: 1,
			failedAt: new Date('2026-06-08T12:00:00Z'),
			lastFinishedAt: new Date('2026-06-08T11:00:00Z'),
		} as ICronJobItem);
		expect(result).to.be.equal('failed');
	});

	it('should return "scheduled" if the job recovered from a failure and has a nextRunAt date', () => {
		const result = deriveStatus({
			_id: '1',
			failCount: 1,
			failedAt: new Date('2026-06-08T11:00:00Z'),
			lastFinishedAt: new Date('2026-06-08T12:00:00Z'),
			nextRunAt: new Date(),
		} as ICronJobItem);
		expect(result).to.be.equal('scheduled');
	});

	it('should return "completed" if it is not disabled, running, scheduled, or failed', () => {
		const result = deriveStatus({ _id: '1', lastFinishedAt: new Date() } as ICronJobItem);
		expect(result).to.be.equal('completed');
	});
});
