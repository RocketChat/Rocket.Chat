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
 * Who is connected to the given LK room, by the identity we mint their token with — which is their Rocket.Chat
 * user id, so the answer needs no translation. An empty array is LiveKit stating the room is empty, including the
 * case of a room that no longer exists at all.
 *
 * `undefined` means we could not ask: a transient LiveKit outage must read as "no answer" rather than "nobody is
 * there", or a call would be emptied by our own inability to reach the SFU.
 */
export async function listRoomParticipantIdentities(roomName: string): Promise<string[] | undefined> {
	try {
		const resp = await twirp<{ participants?: { identity?: string }[] }>('ListParticipants', { room: roomName });
		return (resp.participants ?? []).map(({ identity }) => identity).filter((identity): identity is string => !!identity);
	} catch (err) {
		logger.warn({ msg: 'ListParticipants failed', err, roomName });
		return undefined;
	}
}
