import type { ICronJobItem } from '@rocket.chat/core-typings';

export type CronJobStatus = 'running' | 'scheduled' | 'failed' | 'disabled' | 'completed';

const DEFAULT_LOCK_LIFETIME_MS = 10 * 60 * 1000; // 10 minutes

export function deriveStatus(job: ICronJobItem): CronJobStatus {
	// 1. Disabled check
	if (job.disabled) {
		return 'disabled';
	}

	// 2. Running check (with stale lock detection)
	if (job.lockedAt) {
		const lockExpiry = new Date(job.lockedAt.getTime() + DEFAULT_LOCK_LIFETIME_MS);
		if (lockExpiry > new Date()) {
			return 'running';
		}
		// Lock is stale — worker crashed, not truly running
	}

	// 3. Failed check (compare failedAt vs lastFinishedAt)
	if (job.failCount && job.failCount > 0 && job.failedAt) {
		if (!job.lastFinishedAt || job.failedAt > job.lastFinishedAt) {
			return 'failed';
		}
		// lastFinishedAt > failedAt means most recent run succeeded
	}

	// 4. Scheduled check
	if (job.nextRunAt) {
		return 'scheduled';
	}

	// 5. Default
	return 'completed';
}