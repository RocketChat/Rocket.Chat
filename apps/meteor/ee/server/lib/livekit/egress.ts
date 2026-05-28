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
	// Used to derive a file path inside the bucket / local dir.
	callId: string;
	// Optional layout: "grid" (default), "speaker", "single-speaker".
	layout?: string;
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
		throw new Error('LiveKit URL is not configured (VoIP_TeamCollab_LiveKit_Url)');
	}
	const token = await createLiveKitApiToken({ roomRecord: true, roomAdmin: true });

	const url = `${toHttpUrl(cfg.url)}/twirp/livekit.Egress/${method}`;
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
			throw new Error(`LiveKit Egress.${method} failed: ${resp.status} ${text}`);
		}

		return resp.json() as Promise<T>;
	} catch (err) {
		// Wrap transport errors so the log shows what URL we tried to hit.
		if (err instanceof Error && err.message === 'fetch failed') {
			throw new Error(`LiveKit Egress.${method} transport failure to ${url}: ${(err as any).cause?.message || err.message}`);
		}
		throw err;
	}
}

function buildFileOutput(roomName: string, callId: string): FileOutput {
	const cfg = getLiveKitConfig();
	const stamp = new Date().toISOString().replace(/[:.]/g, '-');
	const filename = `${callId}-${stamp}.mp4`;

	if (cfg.recording.storage === 'local') {
		// No cloud-storage block — egress writes the file to its own filesystem
		// at the absolute path we specify. The egress container needs a host
		// volume mount at the parent directory of localPath for the file to be
		// visible outside the container.
		const dir = cfg.recording.localPath.replace(/\/$/, '');
		return { filepath: `${dir}/${roomName}/${filename}` };
	}

	const { s3 } = cfg.recording;
	return {
		filepath: `rocketchat/${roomName}/${filename}`,
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
	if (!cfg.recording.enabled) {
		throw new Error('LiveKit recording is not enabled');
	}

	const file = buildFileOutput(input.roomName, input.callId);

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
