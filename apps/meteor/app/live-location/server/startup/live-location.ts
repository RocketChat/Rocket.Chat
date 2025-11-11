// liveLocationCleanup.ts
import type { IMessage } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import type { Filter, UpdateFilter, UpdateOptions } from 'mongodb';

import { notifyOnMessageChange } from '../../../lib/server/lib/notifyListener';

const CLEANUP_INTERVAL_MS = 60_000;
const INACTIVE_GRACE_MS = 30_000;

async function broadcastMessageUpdate(messageId: string) {
	const msg = await Messages.findOneById(messageId, {
		projection: { rid: 1, attachments: 1, msg: 1, u: 1, _id: 1, ts: 1, editedAt: 1 },
	});
	if (!msg) return;

	// Broadcast message changes via centralized notifier
	try {
		await notifyOnMessageChange({ id: msg._id, data: msg });
	} catch (e) {
		console.error('[LiveLocationCleanup] notifyOnMessageChange failed:', e);
	}
}

Meteor.startup(async () => {
	let isCleanupRunning = false;

	Meteor.setInterval(async () => {
		if (isCleanupRunning) return;
		isCleanupRunning = true;

		const startedAt = Date.now();
		try {
			const now = new Date();
			const staleBefore = new Date(now.getTime() - INACTIVE_GRACE_MS);

			// Find messages that have ANY live-location attachment that is active & stale/expired
			const findFilter: Filter<IMessage> = {
				attachments: {
					$elemMatch: {
						'type': 'live-location',
						'live.isActive': true,
						'$or': [{ 'live.lastUpdateAt': { $lt: staleBefore } }, { 'live.expiresAt': { $lte: now } }],
					},
				},
			};

			// Capture IDs for broadcasting
			let ids: string[] = [];
			try {
				const docs = await Messages.find(findFilter, { projection: { _id: 1 } }).toArray();
				ids = docs.map((d) => d._id);
			} catch (e) {
				console.error('[LiveLocationCleanup] find() failed:', e);
				return;
			}

			if (!ids.length) {
				return;
			}

			const update: UpdateFilter<IMessage> = {
				$set: {
					'attachments.$[liveAtt].live.isActive': false,
					'attachments.$[liveAtt].live.stoppedAt': now,
				},
			};

			const options: UpdateOptions = {
				arrayFilters: [
					{
						'liveAtt.type': 'live-location',
						'liveAtt.live.isActive': true,
					},
				],
			};

			let matched = 'unknown';
			let modified = 'unknown';
			try {
				const res = await Messages.updateMany({ _id: { $in: ids } }, update, options as any);
				matched = (res as any)?.matchedCount ?? (res as any)?.nMatched ?? 'unknown';
				modified = (res as any)?.modifiedCount ?? (res as any)?.nModified ?? 'unknown';
				console.log(`[LiveLocationCleanup] cleaned ${modified}/${matched} (ids=${ids.length})`);
			} catch (e) {
				console.error('[LiveLocationCleanup] updateMany() failed:', e, 'ids:', ids);
				return;
			}

			try {
				const results = await Promise.allSettled(ids.map((id) => broadcastMessageUpdate(id)));
				const rejected = results.filter((r) => r.status === 'rejected').length;
				if (rejected) {
					console.error(`[LiveLocationCleanup] broadcastMessageUpdate(): ${rejected} failures of ${results.length}`);
				}
			} catch (e) {
				console.error('[LiveLocationCleanup] broadcast phase threw unexpectedly:', e);
			}
		} catch (e) {
			console.error('[LiveLocationCleanup] Uncaught error in interval:', e);
		} finally {
			const elapsed = Date.now() - startedAt;
			console.log(`[LiveLocationCleanup] cycle finished in ${elapsed} ms`);
			isCleanupRunning = false;
		}
	}, CLEANUP_INTERVAL_MS);
});

export const LiveLocationStartup = {
	CLEANUP_INTERVAL_MS,
	INACTIVE_GRACE_MS,
};
