import { Logger } from '@rocket.chat/logger';

import { getLiveKitConfig } from './config';
import { createLiveKitApiToken } from './token';

const logger = new Logger('LiveKit/Egress');

// LiveKit exposes Egress via Twirp at /twirp/livekit.Egress/<Method>.
// We use room composite egress with S3 file output. See:
// https://docs.livekit.io/home/egress/api/

type FileOutput = {
	filepath: string;
	// When omitted, the egress service writes the file to its own local
	// filesystem at `filepath`. This is what we use for the `local` storage
	// mode — the operator is expected to mount a host directory at that path.
	s3?: {
		access_key: string;
		secret: string;
		region: string;
		bucket: string;
		endpoint?: string;
		force_path_style?: boolean;
	};
};

export type StartRoomCompositeEgressInput = {
	roomName: string;
	// Used to derive a file path inside the bucket / local dir when filepath
	// isn't explicitly provided.
	callId: string;
	// Optional layout: "grid" (default), "speaker", "single-speaker".
	layout?: string;
	// Explicit S3 key (or local path) to write the file at. When set, takes
	// priority over the default derived path — used by the FileUpload-integrated
	// flow so the egress output lands at the same key the AmazonS3 store
	// expects when serving via the Rocket.Chat file-download endpoint.
	filepath?: string;
};

export type StartRoomCompositeEgressResult = {
	egressId: string;
	status: string;
	fileUrl?: string;
};

// LiveKit's Twirp API speaks HTTP. The configured URL may be a WebSocket URL
// (ws://, wss://) intended for the JS client — translate it to http(s):// here.
function toHttpUrl(input: string): string {
	const trimmed = input.replace(/\/$/, '');
	if (trimmed.startsWith('wss://')) return `https://${trimmed.slice('wss://'.length)}`;
	if (trimmed.startsWith('ws://')) return `http://${trimmed.slice('ws://'.length)}`;
	return trimmed;
}

async function twirp<T>(method: string, body: Record<string, unknown>): Promise<T> {
	const cfg = getLiveKitConfig();
	if (!cfg.url) {
		throw new Error('LiveKit URL is not configured (VideoConf_LiveKit_Url)');
	}
	const token = await createLiveKitApiToken({ roomRecord: true, roomAdmin: true });

	const url = `${toHttpUrl(cfg.url)}/twirp/livekit.Egress/${method}`;
	// Redact secrets but log the rest of the payload so we can see exactly
	// what egress was asked to do.
	const redactedBody = JSON.parse(JSON.stringify(body));
	if (redactedBody.file_outputs?.[0]?.s3) {
		redactedBody.file_outputs[0].s3 = {
			...redactedBody.file_outputs[0].s3,
			access_key: redactedBody.file_outputs[0].s3.access_key ? '<set>' : '<empty>',
			secret: redactedBody.file_outputs[0].s3.secret ? '<set>' : '<empty>',
		};
	}
	logger.debug({ msg: 'twirp request', method, url, body: redactedBody });
	try {
		const resp = await fetch(url, {
			method: 'POST',
			headers: {
				'authorization': `Bearer ${token}`,
				'content-type': 'application/json',
			},
			body: JSON.stringify(body),
		});

		if (!resp.ok) {
			const text = await resp.text().catch(() => '');
			logger.error({ msg: 'twirp non-ok', method, status: resp.status, body: text });
			throw new Error(`LiveKit Egress.${method} failed: ${resp.status} ${text}`);
		}

		const json = (await resp.json()) as T;
		logger.debug({ msg: 'twirp response', method, response: json });
		return json;
	} catch (err) {
		// Wrap transport errors so the log shows what URL we tried to hit.
		if (err instanceof Error && err.message === 'fetch failed') {
			logger.error({ msg: 'twirp transport failure', method, url, cause: (err as any).cause?.message });
			throw new Error(`LiveKit Egress.${method} transport failure to ${url}: ${(err as any).cause?.message || err.message}`);
		}
		throw err;
	}
}

function buildFileOutput(roomName: string, callId: string, explicitFilepath?: string): FileOutput {
	const cfg = getLiveKitConfig();
	const stamp = new Date().toISOString().replace(/[:.]/g, '-');
	const filename = `${callId}-${stamp}.mp4`;

	if (cfg.recording.storage === 'local') {
		// No cloud-storage block — egress writes the file to its own filesystem
		// at the absolute path we specify. The egress container needs a host
		// volume mount at the parent directory of localPath for the file to be
		// visible outside the container.
		const dir = cfg.recording.localPath.replace(/\/$/, '');
		return { filepath: explicitFilepath || `${dir}/${roomName}/${filename}` };
	}

	const { s3 } = cfg.recording;
	return {
		filepath: explicitFilepath || `rocketchat/${roomName}/${filename}`,
		s3: {
			access_key: s3.accessKey,
			secret: s3.secretKey,
			region: s3.region,
			bucket: s3.bucket,
			...(s3.endpoint ? { endpoint: s3.endpoint, force_path_style: true } : {}),
		},
	};
}

export async function startRoomCompositeEgress(input: StartRoomCompositeEgressInput): Promise<StartRoomCompositeEgressResult> {
	const cfg = getLiveKitConfig();
	logger.info({
		msg: 'startRoomCompositeEgress: called',
		roomName: input.roomName,
		callId: input.callId,
		filepath: input.filepath,
		storage: cfg.recording.storage,
	});
	if (!cfg.recording.enabled) {
		throw new Error('LiveKit recording is not enabled');
	}

	const file = buildFileOutput(input.roomName, input.callId, input.filepath);
	logger.debug({
		msg: 'startRoomCompositeEgress: file output',
		filepath: file.filepath,
		hasS3Block: Boolean(file.s3),
		bucket: file.s3?.bucket,
		region: file.s3?.region,
		endpoint: file.s3?.endpoint,
	});

	// EncodingOptionsPreset enum values (from livekit-egress proto):
	// 0=H264_720P_30, 1=H264_720P_60, 2=H264_1080P_30, 3=H264_1080P_60,
	// 4=PORTRAIT_H264_720P_30, ...
	// 2 (1080p30) gives noticeably better quality than the default 720p30
	// without being too cpu-heavy on the egress container.
	const body = {
		room_name: input.roomName,
		layout: input.layout || 'grid',
		file_outputs: [file],
		audio_only: false,
		preset: 2,
	};

	try {
		const resp = await twirp<{ egress_id: string; status: string }>('StartRoomCompositeEgress', body);
		return { egressId: resp.egress_id, status: resp.status };
	} catch (err) {
		logger.error({ msg: 'Failed to start room composite egress', err, callId: input.callId });
		throw err;
	}
}

export async function stopEgress(egressId: string): Promise<void> {
	try {
		await twirp('StopEgress', { egress_id: egressId });
	} catch (err) {
		logger.warn({ msg: 'Failed to stop egress (may already be stopped)', err, egressId });
	}
}

export type EgressFileResult = { location?: string; filename?: string; size?: string; duration?: string };
export type EgressInfo = {
	egress_id?: string;
	egressId?: string;
	status?: string;
	error?: string;
	file_results?: EgressFileResult[];
	fileResults?: EgressFileResult[];
	file?: EgressFileResult;
};

/**
 * Returns the current EgressInfo for a single egress id. Returns null when LK
 * has no record of it (e.g. egress expired from LK's retention window). Used
 * by the in-process recording poller in place of relying on webhooks.
 */
export async function listEgress(egressId: string): Promise<EgressInfo | null> {
	try {
		const resp = await twirp<{ items?: EgressInfo[] }>('ListEgress', { egress_id: egressId });
		return resp.items?.[0] ?? null;
	} catch (err) {
		logger.warn({ msg: 'ListEgress failed', err, egressId });
		return null;
	}
}
