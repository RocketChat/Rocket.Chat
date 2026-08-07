import { Logger } from '@rocket.chat/logger';
import { VideoConference as VideoConferenceModel } from '@rocket.chat/models';

import { listEgress } from './egress';
import { finalizeRecordingFromEgress } from './finalizeRecording';

const logger = new Logger('LiveKit/MediaCall/Poller');

const POLL_INTERVAL_MS = 10_000; // 10s — LK egress state is slow-moving
const MAX_POLL_DURATION_MS = 4 * 60 * 60 * 1000; // 4h hard cap; LK calls themselves expire at 8h
// If LK reports "no info" for this many consecutive ticks (~1 minute), give
// up — the egress object has expired from LK's retention or never existed
// (e.g. credentials switched between dev runs). Without this cap a stale
// recording.egressId on a call doc would re-spawn the poller on every
// server restart and emit 404 errors forever.
const MAX_CONSECUTIVE_MISSES = 6;

const active = new Map<string, NodeJS.Timeout>();
const missesByEgressId = new Map<string, number>();

function clearPoll(egressId: string) {
	const handle = active.get(egressId);
	if (handle) {
		clearInterval(handle);
		active.delete(egressId);
	}
	missesByEgressId.delete(egressId);
}

/**
 * Poll LiveKit's egress state until it reaches a terminal status (or we hit
 * the time cap), then run finalizeRecordingFromEgress so the chat message
 * gets posted. Used in place of LK webhooks so the recording flow works
 * without exposing a public webhook endpoint (key for local-dev /
 * self-hosted setups behind NAT).
 *
 * Idempotent: calling twice with the same egressId is a no-op for the second
 * call. Polls run in-memory; resumeActiveRecordingPollers() picks them back
 * up on server restart from the DB-persisted recording state.
 */
export function startRecordingPoll(callId: string, egressId: string): void {
	if (active.has(egressId)) {
		logger.debug({ msg: 'poll already running', callId, egressId });
		return;
	}
	const startedAt = Date.now();
	logger.info({ msg: 'starting recording poll', callId, egressId });

	const tick = async () => {
		try {
			const elapsed = Date.now() - startedAt;
			if (elapsed > MAX_POLL_DURATION_MS) {
				logger.warn({ msg: 'recording poll timed out', callId, egressId, elapsedMs: elapsed });
				clearPoll(egressId);
				await VideoConferenceModel.updateRecordingById(callId, { endedAt: new Date(), pollTimedOut: true } as any);
				return;
			}
			const info = await listEgress(egressId);
			logger.debug({ msg: 'poll tick', callId, egressId, status: info?.status, elapsedMs: elapsed });
			if (!info) {
				const misses = (missesByEgressId.get(egressId) ?? 0) + 1;
				missesByEgressId.set(egressId, misses);
				if (misses >= MAX_CONSECUTIVE_MISSES) {
					// LK consistently doesn't know about this egress. Mark the
					// recording as abandoned so we don't keep polling on
					// future restarts. Setting `messageSent: true` is the
					// right cue: it means "this recording is done from our
					// perspective, no further action needed" — same flag
					// the success path uses.
					logger.warn({ msg: 'recording poll abandoned (egress not found)', callId, egressId, misses });
					await VideoConferenceModel.updateRecordingById(callId, {
						endedAt: new Date(),
						messageSent: true,
						pollAbandonedReason: 'egress-not-found',
					} as any);
					clearPoll(egressId);
				}
				return;
			}
			missesByEgressId.delete(egressId);
			const outcome = await finalizeRecordingFromEgress(callId, info);
			if (outcome !== 'still-running') {
				logger.info({ msg: 'poll done', callId, egressId, outcome });
				clearPoll(egressId);
			}
		} catch (err) {
			logger.error({ msg: 'poll tick failed (will retry next interval)', err, callId, egressId });
		}
	};

	// Kick once immediately to handle the case where the recording was
	// already complete by the time we got here (e.g. resume on startup).
	void tick();
	active.set(egressId, setInterval(tick, POLL_INTERVAL_MS));
}

/**
 * On startup, scan calls with an unfinalised recording and resume polling
 * each one. Survives server restarts: as long as the egress id is on the
 * call doc, we can pick the recording back up regardless of how long the
 * server was down.
 */
export async function resumeActiveRecordingPollers(): Promise<void> {
	try {
		const calls = await VideoConferenceModel.findActiveEmbeddedWithRecording();
		logger.info({ msg: 'resuming pollers', count: calls.length });
		for (const call of calls) {
			const egressId = call.recording?.egressId;
			if (egressId) startRecordingPoll(call._id, egressId);
		}
	} catch (err) {
		logger.error({ msg: 'resumeActiveRecordingPollers failed', err });
	}
}
