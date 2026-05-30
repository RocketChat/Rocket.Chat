import { createHash } from 'crypto';

import { verifyHS256 } from '@rocket.chat/jwt';
import { Logger } from '@rocket.chat/logger';
import { MediaCalls as MediaCallsModel, Uploads, Users } from '@rocket.chat/models';
import { ajv, validateBadRequestErrorResponse, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';

import { API } from '../../../app/api/server/api';
import { sendFileMessage } from '../../../app/file-upload/server/methods/sendFileMessage';
import { executeSendMessage } from '../../../app/lib/server/methods/sendMessage';
import { getLiveKitConfig } from '../lib/livekit/config';

const logger = new Logger('MediaCalls/LiveKit/Webhook');

const webhookResponseSchema = ajv.compile<Record<string, unknown>>({ type: 'object', additionalProperties: true });

type EgressFileResult = { location?: string; filename?: string; size?: string; duration?: string };
type EgressInfo = {
	egressId?: string;
	egress_id?: string;
	roomName?: string;
	status?: string;
	fileResults?: EgressFileResult[];
	file_results?: EgressFileResult[];
	file?: EgressFileResult;
	error?: string;
};
type WebhookEvent = {
	event?: string;
	egressInfo?: EgressInfo;
	egress_info?: EgressInfo;
};

/** LK uses camelCase in newer SDKs and snake_case in older ones — accept both. */
const pickEgress = (evt: WebhookEvent): EgressInfo | undefined => evt.egressInfo || evt.egress_info;
const pickEgressId = (e: EgressInfo) => e.egressId || e.egress_id;
const pickFileResults = (e: EgressInfo): EgressFileResult[] => e.fileResults || e.file_results || (e.file ? [e.file] : []);

const pickFileUrl = (results: EgressFileResult[]): string | undefined => {
	for (const r of results) {
		if (r.location) return r.location;
	}
	return undefined;
};

/**
 * LK signs every webhook with a JWT in the Authorization header (no "Bearer "
 * prefix). The JWT's `sha256` claim is the base64 SHA-256 of the raw body —
 * verifying both proves the request actually came from our LK project.
 */
async function verifyWebhook(authHeader: string | undefined, rawBody: string): Promise<boolean> {
	if (!authHeader) return false;
	const token = authHeader.replace(/^Bearer\s+/i, '').trim();
	const { apiSecret, apiKey } = getLiveKitConfig();
	if (!apiSecret) return false;
	try {
		const payload = await verifyHS256(token, apiSecret, { issuer: apiKey });
		const sha = (payload as { sha256?: string }).sha256;
		if (!sha) return false;
		const expected = createHash('sha256').update(rawBody).digest('base64');
		return sha === expected;
	} catch (err) {
		logger.warn({ msg: 'webhook JWT verification failed', err });
		return false;
	}
}

/**
 * Register the egress output as a Rocket.Chat upload and post it as a normal
 * file-attachment message. Two paths:
 *
 *  - When the recording was started with a pre-allocated upload id (the modern
 *    flow): insert an Uploads doc at that id pointing at the AmazonS3 key
 *    egress wrote to, then call sendFileMessage so the message renders the
 *    standard video attachment block (download, preview, etc.).
 *  - When that metadata is missing (legacy recording started before this code
 *    shipped): fall back to a plain link message so the URL still surfaces.
 */
async function postRecordingMessage(opts: {
	rid: string;
	authorUserId: string;
	displayName?: string;
	uploadId?: string;
	uploadKey?: string;
	filename?: string;
	fileUrl: string;
	fileSize: number;
}) {
	const author = (await Users.findOneById(opts.authorUserId)) || (await Users.findOneById('rocket.cat'));
	if (!author) {
		logger.warn({ msg: 'no author available to post recording message', rid: opts.rid });
		return;
	}

	if (opts.uploadId && opts.uploadKey && opts.filename) {
		// AmazonS3 store reads file.AmazonS3.path as the bucket key (with a
		// fallback to file._id). Storing both keeps it robust to default-key
		// changes in the store.
		try {
			await Uploads.insertOne({
				_id: opts.uploadId,
				name: opts.filename,
				type: 'video/mp4',
				typeGroup: 'video',
				size: opts.fileSize,
				rid: opts.rid,
				userId: author._id,
				store: 'AmazonS3:Uploads',
				complete: true,
				uploading: false,
				progress: 1,
				extension: 'mp4',
				uploadedAt: new Date(),
				AmazonS3: { path: opts.uploadKey },
			} as any);

			await sendFileMessage(author._id, {
				roomId: opts.rid,
				file: {
					_id: opts.uploadId,
					name: opts.filename,
					type: 'video/mp4',
					size: opts.fileSize,
				},
				msgData: {
					msg: opts.displayName ? `${opts.displayName} — call recording` : 'Call recording',
				},
			});
			return;
		} catch (err) {
			logger.error({ msg: 'failed to register recording upload; falling back to link', err });
		}
	}

	// Legacy / fallback: just post the raw URL as a chat message.
	const heading = opts.displayName ? `${opts.displayName} — call recording is ready` : 'Call recording is ready';
	await executeSendMessage(author, {
		rid: opts.rid,
		msg: `${heading}\n${opts.fileUrl}`,
	});
}

API.v1.post(
	'media-calls.livekit.webhook',
	{
		authRequired: false,
		rateLimiterOptions: { numRequestsAllowed: 60, intervalTimeInMS: 60000 },
		response: {
			200: webhookResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		// LK posts the raw body and signs the SHA-256 of those exact bytes. We
		// have to re-serialise from bodyParams since the API layer parses JSON
		// for us. LK's canonicalisation matches JSON.stringify of the parsed
		// payload, so this round-trip works in practice.
		const rawBody = JSON.stringify(this.bodyParams);
		const authHeader = this.request.headers.get('authorization') ?? this.request.headers.get('Authorization') ?? undefined;
		const verified = await verifyWebhook(authHeader, rawBody);
		if (!verified) {
			return API.v1.unauthorized();
		}

		const evt = this.bodyParams as WebhookEvent;
		const egress = pickEgress(evt);
		const { event } = evt;
		if (!egress || !event) {
			return API.v1.success({ ok: true, ignored: 'no-egress-info' });
		}

		const egressId = pickEgressId(egress);
		if (!egressId) {
			return API.v1.success({ ok: true, ignored: 'no-egress-id' });
		}

		// We only care about the terminal events.
		if (event !== 'egress_ended' && event !== 'egress_updated') {
			return API.v1.success({ ok: true, ignored: `event:${event}` });
		}

		const call = await MediaCallsModel.findOneByRecordingEgressId(egressId);
		if (!call) {
			logger.debug({ msg: 'webhook for unknown egress', egressId, event });
			return API.v1.success({ ok: true, ignored: 'unknown-egress' });
		}

		const { status } = egress;
		const terminal = status === 'EGRESS_COMPLETE' || status === 'EGRESS_FAILED' || status === 'EGRESS_ABORTED';
		if (!terminal) {
			return API.v1.success({ ok: true, ignored: `status:${status}` });
		}

		const fileResults = status === 'EGRESS_COMPLETE' ? pickFileResults(egress) : [];
		const firstResult = fileResults[0];
		const fileUrl = pickFileUrl(fileResults);
		const fileSize = firstResult?.size ? Number(firstResult.size) : 0;

		await MediaCallsModel.updateOne(
			{ _id: call._id },
			{
				$set: {
					'recording.endedAt': new Date(),
					...(fileUrl && { 'recording.fileUrl': fileUrl }),
				},
			},
		);

		// Idempotency: webhooks can deliver the same egress_ended event more than
		// once. messageSent on the recording doc gates the upload+message side
		// effects so a retry doesn't duplicate the message in the channel.
		if (status === 'EGRESS_COMPLETE' && fileUrl && call.rid && !call.recording?.messageSent) {
			try {
				await postRecordingMessage({
					rid: call.rid,
					authorUserId: call.createdBy?.id || 'rocket.cat',
					displayName: call.createdBy?.displayName,
					uploadId: call.recording?.uploadId,
					uploadKey: call.recording?.uploadKey,
					filename: call.recording?.filename,
					fileUrl,
					fileSize,
				});
				await MediaCallsModel.updateOne({ _id: call._id }, { $set: { 'recording.messageSent': true } });
			} catch (err) {
				logger.error({ msg: 'failed to post recording message', err, callId: call._id, rid: call.rid });
			}
		} else if ((status === 'EGRESS_FAILED' || status === 'EGRESS_ABORTED') && call.rid) {
			logger.warn({ msg: 'egress ended unsuccessfully', status, error: egress.error, callId: call._id });
		}

		return API.v1.success({ ok: true });
	},
);
