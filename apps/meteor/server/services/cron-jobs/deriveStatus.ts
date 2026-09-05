import { DEFAULT_LOCK_LIFETIME } from '@rocket.chat/agenda';
import type { ICronJobItem, CronJobStatus } from '@rocket.chat/core-typings';

export function deriveStatus(job: ICronJobItem): CronJobStatus {
	if (job.disabled) {
		return 'disabled';
	}

	if (job.lockedAt) {
		const lockExpiry = new Date(job.lockedAt.getTime() + DEFAULT_LOCK_LIFETIME);
		if (lockExpiry > new Date()) {
			return 'running';
		}
	}

	if (job.failCount && job.failCount > 0 && job.failedAt) {
		if (!job.lastFinishedAt || job.failedAt >= job.lastFinishedAt) {
			return 'failed';
		}
	}

	if (job.nextRunAt) {
		return 'scheduled';
	}

	return 'completed';
}
