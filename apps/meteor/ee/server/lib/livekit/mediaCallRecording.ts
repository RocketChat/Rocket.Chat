import { randomUUID } from 'crypto';

import { Logger } from '@rocket.chat/logger';
import { MediaCalls as MediaCallsModel } from '@rocket.chat/models';

import { getLiveKitConfig } from './config';
import { startRoomCompositeEgress, stopEgress } from './egress';

const logger = new Logger('LiveKit/MediaCall/Recording');

const livekitRoomNameFor = (callId: string) => `mc-${callId}`;

/**
 * Pre-allocate the upload id and S3 key for the egress output so we can later
 * insert an Uploads row at exactly that key and have Rocket.Chat's AmazonS3
 * store serve it through the normal /file-upload/<id>/<name> URLs. Without
 * this, egress would write to its own arbitrary path and we'd have to either
 * register a remote-URL attachment (bypassing access control) or copy the file.
 */
function buildUploadTarget(callId: string) {
	const uploadId = randomUUID();
	const stamp = new Date().toISOString().replace(/[:.]/g, '-');
	const filename = `call-recording-${stamp}.mp4`;
	// The AmazonS3 store uses file.AmazonS3.path (or falls back to file._id)
	// as the S3 object key. Putting the upload id in the key keeps it
	// collision-free across calls and lets us reuse the default key shape
	// (just the id) without any path prefix the store has to know about.
	const s3Key = uploadId;
	return { uploadId, filename, s3Key, callId };
}

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
	const target = buildUploadTarget(callId);
	try {
		const egress = await startRoomCompositeEgress({
			roomName,
			callId,
			// Tell egress to write at the upload's S3 key so the file lands
			// exactly where Rocket.Chat's AmazonS3 store expects it.
			filepath: target.s3Key,
		});
		await MediaCallsModel.updateOne(
			{ _id: callId },
			{
				$set: {
					recording: {
						egressId: egress.egressId,
						startedAt: new Date(),
						storage: cfg.recording.storage,
						// Persist so the webhook can insert the Uploads row + post
						// the message even after a server restart.
						uploadId: target.uploadId,
						uploadKey: target.s3Key,
						filename: target.filename,
					} as any,
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
