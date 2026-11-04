import { DdpSession } from '../lib/ddp.mjs';
import { EventQueue } from '../lib/queue.mjs';

// the room events the web client subscribes to when it opens a room (LegacyRoomManager, UserAction)
const ROOM_EVENTS = ['messagesImported', 'deleteMessage', 'deleteMessageBulk', 'messagesRead', 'user-activity'];

const toEvent = (message, recvTs) => ({
	type: 'full',
	streamId: message.streaming.id,
	mid: message._id,
	seq: message.streaming.seq,
	ts: message.streaming.ts,
	state: message.streaming.state,
	blocks: message.blocks,
	recvTs,
});

/**
 * The baseline viewer: it reads the streamed reply from the full message updates of `room-messages`. Its snapshot is
 * the persisted message, read over REST.
 */
export const create = ({ baseUrl, userId, token }) => {
	const session = new DdpSession(baseUrl);
	const queue = new EventQueue();
	let httpBytes = 0;
	// events that arrive while the snapshot is read wait behind it, so the viewer sees the snapshot first
	let held;

	session.onChanged = (msg) => {
		if (msg.collection !== 'stream-room-messages') {
			return;
		}
		const [message] = msg.fields.args;
		if (!message?.streaming) {
			return;
		}
		const event = toEvent(message, Date.now());
		held ? held.push(event) : queue.push(event);
	};
	session.onClose = () => queue.end();

	return {
		get bytesIn() {
			return session.bytesIn + httpBytes;
		},

		async connect() {
			await session.connect();
			await session.login(token);
		},

		async open({ rid, mid }) {
			if (mid) {
				held = [];
			}
			await Promise.all([
				session.stream('room-messages', rid),
				...ROOM_EVENTS.map((event) => session.stream('notify-room', `${rid}/${event}`)),
			]);
			if (!mid) {
				return;
			}

			const res = await fetch(`${baseUrl}/api/v1/chat.getMessage?msgId=${mid}`, {
				headers: { 'X-User-Id': userId, 'X-Auth-Token': token },
			});
			const body = await res.text();
			httpBytes += Buffer.byteLength(body);
			const { message } = JSON.parse(body);
			queue.push({ ...toEvent(message, Date.now()), type: 'snapshot' });
			held.forEach((event) => queue.push(event));
			held = undefined;
		},

		events: () => queue,

		close() {
			session.close();
		},
	};
};
