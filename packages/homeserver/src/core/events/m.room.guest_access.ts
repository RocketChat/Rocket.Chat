import { createEventBase, type EventBase } from './eventBase';
import { createEventWithId } from './utils/createSignedEvent';

declare module './eventBase' {
	interface Events {
		'm.room.guest_access': RoomGuestAccessEvent;
	}
}

export interface RoomGuestAccessEvent extends EventBase {
	content: {
		guest_access: "can_join" | 'forbidden';
	};
	unsigned?: Record<string, unknown>;
}

export const roomGuestAccessEvent = ({
	roomId,
	sender,
	auth_events,
	prev_events,
	depth,
	ts = Date.now(),
}: {
	roomId: string;
	sender: string;
	auth_events: string[];
	prev_events: string[];
	depth: number;
	ts?: number;
}) => {
	return createEventBase('m.room.guest_access', {
		roomId,
		sender,
		auth_events,
		prev_events,
		depth,
		content: { guest_access: 'can_join' },
		state_key: '',
		origin_server_ts: ts,
		ts,
		unsigned: { age_ts: ts },
	});
};

export const createRoomGuestAccessEvent =
	createEventWithId(roomGuestAccessEvent);
