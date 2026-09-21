import { DEFAULT_LOCK_LIFETIME } from '@rocket.chat/agenda';
import type { ICronJobItem, CronJobStatus } from '@rocket.chat/core-typings';
import {
	AppScheduler,
	CronJobs,
	OmnichannelAutoCloseScheduler,
	OmnichannelAutoTransferScheduler,
	OmnichannelQueueInactivityScheduler,
} from '@rocket.chat/models';
import type { Collection } from 'mongodb';

import { addMigration } from '../../lib/migrations';

function deriveStatusFromRaw(
	job: Pick<ICronJobItem, 'disabled' | 'lockedAt' | 'failCount' | 'failedAt' | 'lastFinishedAt' | 'nextRunAt'>,
): CronJobStatus {
	if (job.disabled) {
		return 'disabled';
	}

	if (job.lockedAt) {
		if (job.lockedAt.getTime() + DEFAULT_LOCK_LIFETIME > Date.now()) {
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

async function backfillCollection(col: Collection<any>): Promise<void> {
	const cursor = col.find(
		{ status: { $exists: false } },
		{ projection: { disabled: 1, lockedAt: 1, failCount: 1, failedAt: 1, lastFinishedAt: 1, nextRunAt: 1 } },
	);

	const ops: Array<{ updateOne: { filter: object; update: object } }> = [];

	for await (const doc of cursor) {
		const status = deriveStatusFromRaw(doc);
		ops.push({ updateOne: { filter: { _id: doc._id, status: { $exists: false } }, update: { $set: { status } } } });

		if (ops.length === 500) {
			await col.bulkWrite(ops);
			ops.length = 0;
		}
	}

	if (ops.length > 0) {
		await col.bulkWrite(ops);
	}
}

addMigration({
	version: 337,
	name: 'Backfill status field on cron job documents',
	async up() {
		await Promise.all([
			backfillCollection(CronJobs.col),
			backfillCollection(AppScheduler.col),
			backfillCollection(OmnichannelAutoCloseScheduler.col),
			backfillCollection(OmnichannelAutoTransferScheduler.col),
			backfillCollection(OmnichannelQueueInactivityScheduler.col),
		]);
	},
});
