import { Logger } from '@rocket.chat/logger';

import { getLiveKitConfig } from './config';
import { createLiveKitApiToken } from './token';

const logger = new Logger('LiveKit/RoomService');

// LiveKit's RoomService API uses Twirp at /twirp/livekit.RoomService/<Method>.
// https://docs.livekit.io/home/server/managing-rooms/

function toHttpUrl(input: string): string {
	const trimmed = input.replace(/\/$/, '');
	if (trimmed.startsWith('wss://')) return `https://${trimmed.slice('wss://'.length)}`;
	if (trimmed.startsWith('ws://')) return `http://${trimmed.slice('ws://'.length)}`;
	return trimmed;
}

async function twirp<T>(method: string, body: Record<string, unknown>): Promise<T> {
	const cfg = getLiveKitConfig();
	if (!cfg.url) {
		throw new Error('LiveKit URL is not configured');
	}
	const token = await createLiveKitApiToken({ roomAdmin: true, roomList: true });
	const url = `${toHttpUrl(cfg.url)}/twirp/livekit.RoomService/${method}`;
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
		throw new Error(`LiveKit RoomService.${method} failed: ${resp.status} ${text}`);
	}
	return resp.json() as Promise<T>;
}

/**
 * Count participants currently connected to the given LK room. Returns 0 if
 * the room doesn't exist (LK returns an empty participants array, not an
 * error). Used by the reconciler to decide whether a group call doc is stale.
 */
export async function countRoomParticipants(roomName: string): Promise<number> {
	try {
		const resp = await twirp<{ participants?: unknown[] }>('ListParticipants', { room: roomName });
		return resp.participants?.length ?? 0;
	} catch (err) {
		logger.warn({ msg: 'ListParticipants failed', err, roomName });
		// Be conservative: on error we report "unknown" by returning -1 so the
		// caller can avoid acting on a transient LK outage.
		return -1;
	}
}
