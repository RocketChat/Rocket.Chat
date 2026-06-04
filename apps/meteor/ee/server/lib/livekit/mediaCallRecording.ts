import { randomUUID } from 'crypto';

import { Logger } from '@rocket.chat/logger';
import { VideoConference as VideoConferenceModel } from '@rocket.chat/models';

import { getLiveKitConfig } from './config';
import { startRoomCompositeEgress, stopEgress } from './egress';
import { startRecordingPoll } from './recordingPoller';
import { settings } from '../../../../app/settings/server';

const logger = new Logger('LiveKit/MediaCall/Recording');

const livekitRoomNameFor = (callId: string) => `mc-${callId}`;

/**
 * Pre-allocate the upload id and S3 key for the egress output so we can later
 * insert an Uploads row at exactly that key and have Rocket.Chat's AmazonS3
 * store serve it through the normal /file-upload/<id>/<name> URLs.
 *
 * The key matches the layout the regular Uploads store uses:
 *   <workspace-uniqueID>/uploads/<rid>/<userId>/<uploadId>.mp4
 *
 * (See FileUpload.defaults.Uploads.getPath in app/file-upload/server/lib).
 * We persist the same string on `file.AmazonS3.path`, which the AmazonS3
 * store reads as the bucket key when serving the download — keeping the
 * recording neatly scoped under the room's folder like any other attachment.
 */
function buildUploadTarget(callId: string, rid: string, userId: string) {
	const uploadId = randomUUID();
	const stamp = new Date().toISOString().replace(/[:.]/g, '-');
	const filename = `call-recording-${stamp}.mp4`;
	const workspaceId = settings.get<string>('uniqueID') || 'rocketchat';
	// Spell the .mp4 extension out: LK auto-appends an extension when the
	// filepath has none, so without this the key would land at `<base>.mp4`
	// while AmazonS3.path stores `<base>` and the download 404s. With the
	// extension explicit, LK writes to the exact key we record.
	const s3Key = `${workspaceId}/uploads/${rid}/${userId}/${uploadId}.mp4`;
	return { uploadId, filename, s3Key, callId };
}

/**
 * Recording state is persisted on the IMediaCall document under `recording`.
 * Survives server restart; multiple Meteor instances can coordinate via the
 * single source of truth in Mongo.
 */
export async function startMediaCallRecording(callId: string): Promise<{ egressId: string; status: 'starting' }> {
	logger.info({ msg: 'startMediaCallRecording: called', callId });
	const cfg = getLiveKitConfig();
	logger.debug({
		msg: 'startMediaCallRecording: config',
		callId,
		recordingEnabled: cfg.recording.enabled,
		storage: cfg.recording.storage,
		bucket: cfg.recording.s3?.bucket,
		region: cfg.recording.s3?.region,
		hasAccessKey: Boolean(cfg.recording.s3?.accessKey),
		hasSecretKey: Boolean(cfg.recording.s3?.secretKey),
		endpoint: cfg.recording.s3?.endpoint,
	});
	if (!cfg.recording.enabled) {
		logger.warn({ msg: 'startMediaCallRecording: recording not enabled', callId });
		throw new Error('recording-not-enabled');
	}

	const existing = await VideoConferenceModel.findOneById(callId);
	if (existing?.recording?.egressId && !existing.recording.endedAt) {
		logger.info({ msg: 'startMediaCallRecording: already recording, returning existing', callId, egressId: existing.recording.egressId });
		// Idempotent: already recording.
		return { egressId: existing.recording.egressId, status: 'starting' };
	}

	const rid = existing?.rid;
	const userId = existing?.createdBy?._id;
	if (!rid || !userId) {
		logger.error({
			msg: 'startMediaCallRecording: missing rid/userId on call doc',
			callId,
			hasRid: Boolean(rid),
			hasUserId: Boolean(userId),
		});
		throw new Error('call-missing-rid-or-creator');
	}

	const roomName = livekitRoomNameFor(callId);
	const target = buildUploadTarget(callId, rid, userId);
	logger.info({
		msg: 'startMediaCallRecording: starting egress',
		callId,
		roomName,
		uploadId: target.uploadId,
		s3Key: target.s3Key,
		filename: target.filename,
	});
	try {
		const egress = await startRoomCompositeEgress({
			roomName,
			callId,
			// Tell egress to write at the upload's S3 key so the file lands
			// exactly where Rocket.Chat's AmazonS3 store expects it.
			filepath: target.s3Key,
		});
		logger.info({ msg: 'startMediaCallRecording: egress started', callId, egressId: egress.egressId, status: egress.status });
		await VideoConferenceModel.setRecordingById(callId, {
			egressId: egress.egressId,
			startedAt: new Date(),
			storage: cfg.recording.storage,
			// Persist so the webhook can insert the Uploads row + post
			// the message even after a server restart.
			uploadId: target.uploadId,
			uploadKey: target.s3Key,
			filename: target.filename,
		} as any);
		logger.debug({ msg: 'startMediaCallRecording: persisted recording metadata to call doc', callId });
		// Start polling LK for the egress's terminal state. The poller calls
		// finalizeRecording on completion so the chat message gets posted
		// without needing the inbound webhook (useful for local dev / setups
		// behind NAT). Idempotent — duplicate starts are deduped by egressId.
		startRecordingPoll(callId, egress.egressId);
		return { egressId: egress.egressId, status: 'starting' };
	} catch (err) {
		logger.error({ msg: 'Failed to start media-call recording', err, callId });
		throw err;
	}
}

export async function stopMediaCallRecording(callId: string): Promise<void> {
	const call = await VideoConferenceModel.findOneById(callId);
	const egressId = call?.recording?.egressId;
	if (!egressId) return;

	try {
		await stopEgress(egressId);
	} finally {
		await VideoConferenceModel.updateRecordingById(callId, { endedAt: new Date() });
	}
}

export async function getMediaCallRecordingState(callId: string): Promise<{ recording: boolean; egressId?: string }> {
	const call = await VideoConferenceModel.findOneById(callId);
	const rec = call?.recording;
	if (!rec?.egressId || rec.endedAt) {
		return { recording: false };
	}
	return { recording: true, egressId: rec.egressId };
}
