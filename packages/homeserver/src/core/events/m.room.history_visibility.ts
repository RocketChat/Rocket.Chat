import { createEventBase, type EventBase } from './eventBase';
import { createEventWithId } from './utils/createSignedEvent';

declare module './eventBase' {
	interface Events {
		'm.room.history_visibility': RoomHistoryVisibilityEvent;
	}
}

export interface RoomHistoryVisibilityEvent extends EventBase {
	content: {
		history_visibility: 'shared' | 'invited' | 'joined';
	};
	unsigned: {
		age_ts: number;
	};
}

export const roomHistoryVisibilityEvent = ({
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
	return createEventBase('m.room.history_visibility', {
		roomId,
		sender,
		auth_events,
		prev_events,
		depth,
		content: { history_visibility: 'shared' },
		state_key: '',
		origin_server_ts: ts,
		ts,
		unsigned: { age_ts: ts },
	});
};

export const createRoomHistoryVisibilityEvent = createEventWithId(
	roomHistoryVisibilityEvent,
);
