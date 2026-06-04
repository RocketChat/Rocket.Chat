import { Logger } from '@rocket.chat/logger';
import { VideoConference as VideoConferenceModel, Uploads, Users } from '@rocket.chat/models';

import type { EgressInfo, EgressFileResult } from './egress';
import { sendFileMessage } from '../../../../app/file-upload/server/methods/sendFileMessage';
import { executeSendMessage } from '../../../../app/lib/server/methods/sendMessage';

const logger = new Logger('LiveKit/MediaCall/Finalize');

const pickEgressId = (e: EgressInfo) => e.egressId || e.egress_id;
const pickFileResults = (e: EgressInfo): EgressFileResult[] => e.fileResults || e.file_results || (e.file ? [e.file] : []);
const pickFileUrl = (results: EgressFileResult[]): string | undefined => {
	for (const r of results) {
		if (r.location) return r.location;
	}
	return undefined;
};

export type FinalizeOutcome = 'posted' | 'already-sent' | 'still-running' | 'failed' | 'no-call' | 'missing-data';

/**
 * Register the egress output as a Rocket.Chat upload and post it as a file
 * message in the call's room. Idempotent: `recording.messageSent` on the call
 * doc gates the side effects, so retries (whether from the poller or a stale
 * webhook delivery) won't duplicate the chat message.
 *
 * Returns an outcome string so callers can stop polling once the recording is
 * either successfully handled or terminally failed.
 */
export async function finalizeRecordingFromEgress(callId: string, egress: EgressInfo | null): Promise<FinalizeOutcome> {
	if (!egress) {
		logger.warn({ msg: 'finalize: no egress info', callId });
		return 'still-running';
	}

	const egressId = pickEgressId(egress);
	const { status } = egress;
	logger.debug({ msg: 'finalize: evaluating', callId, egressId, status });

	const call = await VideoConferenceModel.findOneById(callId);
	if (!call) {
		logger.warn({ msg: 'finalize: call not found', callId });
		return 'no-call';
	}
	if (call.recording?.messageSent) {
		logger.debug({ msg: 'finalize: message already sent', callId });
		return 'already-sent';
	}

	const terminal = status === 'EGRESS_COMPLETE' || status === 'EGRESS_FAILED' || status === 'EGRESS_ABORTED';
	if (!terminal) return 'still-running';

	if (status !== 'EGRESS_COMPLETE') {
		await VideoConferenceModel.updateRecordingById(call._id, { endedAt: new Date() });
		logger.warn({ msg: 'finalize: egress ended unsuccessfully', status, error: egress.error, callId });
		return 'failed';
	}

	const fileResults = pickFileResults(egress);
	const firstResult = fileResults[0];
	const fileUrl = pickFileUrl(fileResults);
	const fileSize = firstResult?.size ? Number(firstResult.size) : 0;
	const { uploadId, uploadKey, filename } = call.recording ?? {};

	if (!uploadId || !uploadKey || !filename) {
		logger.warn({ msg: 'finalize: missing upload metadata; cannot post file message', callId });
		await VideoConferenceModel.updateRecordingById(call._id, { endedAt: new Date() });
		return 'missing-data';
	}
	if (!call.rid) {
		logger.warn({ msg: 'finalize: call has no rid; cannot post', callId });
		return 'missing-data';
	}

	const authorUserId = call.createdBy?._id || 'rocket.cat';
	const author = (await Users.findOneById(authorUserId)) || (await Users.findOneById('rocket.cat'));
	if (!author) {
		logger.warn({ msg: 'finalize: no author user found', callId, authorUserId });
		return 'missing-data';
	}

	logger.info({ msg: 'finalize: inserting upload + posting message', callId, uploadId, rid: call.rid });

	try {
		await Uploads.insertOne({
			_id: uploadId,
			name: filename,
			type: 'video/mp4',
			typeGroup: 'video',
			size: fileSize,
			rid: call.rid,
			userId: author._id,
			store: 'AmazonS3:Uploads',
			complete: true,
			uploading: false,
			progress: 1,
			extension: 'mp4',
			uploadedAt: new Date(),
			AmazonS3: { path: uploadKey },
		} as any);
		// Post the recording as a thread reply under the call's "Call ongoing"
		// block message so the channel stays tidy: one top-level entry per
		// call, with recording + summary tucked inside its thread.
		const parentMessageId = call.messages?.started;
		await sendFileMessage(author._id, {
			roomId: call.rid,
			file: { _id: uploadId, name: filename, type: 'video/mp4', size: fileSize },
			msgData: {
				msg: call.createdBy?.name ? `${call.createdBy.name} — call recording` : 'Call recording',
				...(parentMessageId && { tmid: parentMessageId }),
			},
		});
	} catch (err) {
		logger.error({ msg: 'finalize: upload/sendFileMessage failed; falling back to plain link', err, callId });
		// Best-effort fallback so the user at least gets a URL when LK provides one.
		if (fileUrl) {
			try {
				const parentMessageId = call.messages?.started;
				await executeSendMessage(author, {
					rid: call.rid,
					msg: `Call recording is ready\n${fileUrl}`,
					...(parentMessageId && { tmid: parentMessageId }),
				} as any);
			} catch (e) {
				logger.error({ msg: 'finalize: link fallback also failed', err: e, callId });
				return 'failed';
			}
		} else {
			return 'failed';
		}
	}

	await VideoConferenceModel.updateRecordingById(call._id, {
		endedAt: new Date(),
		messageSent: true,
		...(fileUrl && { fileUrl }),
	});
	logger.info({ msg: 'finalize: done', callId });
	return 'posted';
}
