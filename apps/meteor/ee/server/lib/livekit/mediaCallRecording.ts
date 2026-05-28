import { Logger } from '@rocket.chat/logger';
import { MediaCalls as MediaCallsModel } from '@rocket.chat/models';

import { getLiveKitConfig } from './config';
import { startRoomCompositeEgress, stopEgress } from './egress';

const logger = new Logger('LiveKit/MediaCall/Recording');

const livekitRoomNameFor = (callId: string) => `mc-${callId}`;

/**
 * Recording state is persisted on the IMediaCall document under `recording`.
 * Survives server restart; multiple Meteor instances can coordinate via the
 * single source of truth in Mongo.
 */
export async function startMediaCallRecording(callId: string): Promise<{ egressId: string; status: 'starting' }> {
	const cfg = getLiveKitConfig();
	if (!cfg.recording.enabled) {
		throw new Error('recording-not-enabled');
	}

	const existing = await MediaCallsModel.findOneById(callId);
	if (existing?.recording?.egressId && !existing.recording.endedAt) {
		// Idempotent: already recording.
		return { egressId: existing.recording.egressId, status: 'starting' };
	}

	const roomName = livekitRoomNameFor(callId);
	try {
		const egress = await startRoomCompositeEgress({ roomName, callId });
		await MediaCallsModel.updateOne(
			{ _id: callId },
			{
				$set: {
					recording: {
						egressId: egress.egressId,
						startedAt: new Date(),
						storage: cfg.recording.storage,
					},
				},
			},
		);
		return { egressId: egress.egressId, status: 'starting' };
	} catch (err) {
		logger.error({ msg: 'Failed to start media-call recording', err, callId });
		throw err;
	}
}

export async function stopMediaCallRecording(callId: string): Promise<void> {
	const call = await MediaCallsModel.findOneById(callId);
	const egressId = call?.recording?.egressId;
	if (!egressId) return;

	try {
		await stopEgress(egressId);
	} finally {
		await MediaCallsModel.updateOne({ _id: callId }, { $set: { 'recording.endedAt': new Date() } });
	}
}

export async function getMediaCallRecordingState(callId: string): Promise<{ recording: boolean; egressId?: string }> {
	const call = await MediaCallsModel.findOneById(callId);
	const rec = call?.recording;
	if (!rec?.egressId || rec.endedAt) {
		return { recording: false };
	}
	return { recording: true, egressId: rec.egressId };
}
