import { createEventBase, type EventBase } from './eventBase';
import { createEventWithId } from './utils/createSignedEvent';

export interface RoomCreateEvent extends EventBase {
	content: {
		room_version: string;
		creator: string;
	};
	unsigned: {
		age_ts: number;
	};
}

declare module './eventBase' {
	interface Events {
		'm.room.create': RoomCreateEvent;
	}
}

type RoomCreateEventProps = {
	roomId: string;
	sender: string;
	ts?: number;
};

export const roomCreateEvent = ({
	roomId,
	sender,
	ts = Date.now(),
}: RoomCreateEventProps): RoomCreateEvent =>
	createEventBase('m.room.create', {
		roomId,
		sender,
		depth: 1,
		ts,
		content: {
			room_version: '10',
			creator: sender,
		},
		state_key: '',
		origin_server_ts: ts,
		unsigned: { age_ts: ts },
	});

export const createRoomCreateEvent = createEventWithId((...args: any[]) =>
	roomCreateEvent(args[0]),
);

export const isRoomCreateEvent = (event: EventBase): event is RoomCreateEvent =>
	event.type === 'm.room.create';
