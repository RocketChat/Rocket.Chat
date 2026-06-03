import { cronJobs } from '@rocket.chat/cron';
import { Logger } from '@rocket.chat/logger';
import { MediaCalls as MediaCallsModel } from '@rocket.chat/models';

import { getLiveKitConfig, isLiveKitFullyConfigured } from './config';
import { countRoomParticipants } from './roomService';
import notifications from '../../../../app/notifications/server/lib/Notifications';
import { maybeGenerateSummary } from '../livekit-agent/summary';

const logger = new Logger('LiveKit/Cleanup');

const CRON_NAME = 'media-calls-group-reconcile';
const CRON_INTERVAL = 'every 1 mins';

// Grace period before we treat an empty room as a stuck call. Brand new calls
// might briefly show 0 participants while the first peer is still negotiating;
// older "every participant has crashed" calls deserve to be ended fast though.
const MIN_AGE_BEFORE_END_MS = 60 * 1000;

const livekitRoomNameFor = (callId: string) => `mc-${callId}`;

/**
 * For every active group call, ask LiveKit how many participants are actually
 * in the room. If a call has been around longer than the grace period and LK
 * reports zero participants, mark the call as ended — the participants[] list
 * on the doc is stale (browser crash, missed leave POST, etc.) and the call
 * is otherwise "stuck active" until expiresAt (8h) which leaves users blocked.
 */
export async function reconcileGroupCalls(): Promise<void> {
	if (!isLiveKitFullyConfigured()) return;

	const calls = await MediaCallsModel.findActiveGroupCalls().toArray();
	if (calls.length === 0) return;

	const now = Date.now();
	for (const call of calls) {
		try {
			const age = now - new Date(call.createdAt).getTime();
			if (age < MIN_AGE_BEFORE_END_MS) continue;

			const present = await countRoomParticipants(livekitRoomNameFor(call._id));
			// -1 = LK query failed; don't touch the call on transient errors.
			if (present !== 0) continue;

			logger.info({ msg: 'ending stuck group call (no LK participants)', callId: call._id, rid: call.rid });
			await MediaCallsModel.hangupCallById(call._id, { reason: 'reconciler-no-participants' });
			// Notify the room so any subscribed client refreshes its "active
			// call" state without waiting for a polling tick.
			if (call.rid) {
				try {
					(notifications.notifyRoom as any)(call.rid, 'media-call-state', { action: 'ended', callId: call._id });
				} catch {
					/* notify is best-effort */
				}
			}
			// Best-effort summary generation. maybeGenerateSummary is idempotent
			// (checks feature flag, transcript presence, and !summary.messageId
			// before doing anything) so it's safe to call unconditionally.
			void maybeGenerateSummary(call._id).catch((err) => logger.warn({ msg: 'summary post-cleanup failed', err, callId: call._id }));
		} catch (err) {
			logger.warn({ msg: 'reconciliation failed for call', err, callId: call._id });
		}
	}
}

export async function registerGroupCallReconcileCron(): Promise<void> {
	try {
		if (await cronJobs.has(CRON_NAME)) return;
		await cronJobs.add(CRON_NAME, CRON_INTERVAL, async () => {
			const cfg = getLiveKitConfig();
			if (!cfg.enabled) return;
			await reconcileGroupCalls();
		});
		logger.info({ msg: 'group call reconcile cron registered', interval: CRON_INTERVAL });
	} catch (err) {
		logger.error({ msg: 'failed to register reconcile cron', err });
	}
}
