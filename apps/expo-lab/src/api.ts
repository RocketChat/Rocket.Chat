import { mock } from './chatConfig';
import { mockMessages, mockRooms } from './mockData';
import type { Session } from './session';

export type RoomType = 'c' | 'p' | 'd' | 'l';

export type RoomItem = { rid: string; t: RoomType; title: string; unread: number; sortKey: string };

export type ChatMessage = { _id: string; rid: string; msg: string; ts: string; u: { _id: string; username?: string; name?: string } };

type Subscription = { rid: string; t: RoomType; name: string; fname?: string; open: boolean; unread: number; lr?: string; _updatedAt: string };

export async function listRooms({ sdk }: Session): Promise<RoomItem[]> {
	if (mock) return mockRooms;
	// Not in rest-typings, so no typed `rest.get`.
	const response = await sdk.rest.send('/v1/subscriptions.get', 'GET');
	const { update } = (await response.json()) as { update: Subscription[] };
	return update
		.filter((s) => s.open)
		.map((s) => ({
			rid: s.rid,
			t: s.t,
			title: s.fname || s.name,
			unread: s.unread,
			sortKey: String(s.lr ?? s._updatedAt),
		}))
		.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}

const historyEndpoint = { c: '/v1/channels.history', p: '/v1/groups.history', d: '/v1/im.history' } as const;

// Newest first, as the server returns it.
export async function loadHistory({ sdk }: Session, room: RoomItem, count = 40): Promise<ChatMessage[]> {
	if (mock) return mockMessages;
	if (room.t === 'l') return [];
	const { messages } = await sdk.rest.get(historyEndpoint[room.t], { roomId: room.rid, count });
	return messages as unknown as ChatMessage[];
}

export async function sendMessage({ sdk }: Session, rid: string, msg: string): Promise<void> {
	if (mock) return;
	await sdk.rest.post('/v1/chat.sendMessage', { message: { rid, msg } });
}

export type RoomSubscription = { ready: () => Promise<unknown>; stop: () => void };

export function subscribeRoom({ sdk }: Session, rid: string, onMessage: (message: ChatMessage) => void): RoomSubscription {
	if (mock) return { ready: () => Promise.resolve(), stop: () => undefined };
	return sdk.stream('room-messages', rid, (m) => onMessage(m as unknown as ChatMessage));
}

// RN's fetch Response is a polyfill, so `instanceof Response` is false for rejections from the SDK.
export const isHttpError = (e: unknown): e is { status: number } => typeof e === 'object' && e !== null && 'status' in e;
