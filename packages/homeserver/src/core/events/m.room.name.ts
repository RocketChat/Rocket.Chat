import { createEventBase, type EventBase } from './eventBase';
import { createEventWithId } from './utils/createSignedEvent';

declare module './eventBase' {
	interface Events {
		'm.room.name': {
			content: {
				name: string;
			};
			state_key: '';
			unsigned?: {
				age_ts?: number;
			};
		};
	}
}

export type RoomNameAuthEvents = {
	'm.room.create': string;
	'm.room.power_levels': string;
	'm.room.member': string;
};

export const isRoomNameEvent = (event: EventBase): event is RoomNameEvent => {
	return event.type === 'm.room.name';
};

export interface RoomNameEvent extends EventBase {
	type: 'm.room.name';
	state_key: '';
	content: {
		name: string;
	};
}

const isTruthy = <T>(
	value: T | null | undefined | false | 0 | '',
): value is T => {
	return Boolean(value);
};

export const roomNameEvent = ({
	roomId,
	sender,
	auth_events,
	prev_events,
	depth,
	content,
	origin,
	ts = Date.now(),
}: {
	roomId: string;
	sender: string;
	auth_events: RoomNameAuthEvents;
	prev_events: string[];
	depth: number;
	content: {
		name: string;
	};
	origin?: string;
	ts?: number;
}): RoomNameEvent => {
	return createEventBase('m.room.name', {
		roomId,
		sender,
		state_key: '',
		auth_events: [
			auth_events['m.room.create'],
			auth_events['m.room.power_levels'],
			auth_events['m.room.member'],
		].filter(isTruthy),
		prev_events,
		depth,
		content,
		origin_server_ts: ts,
		ts,
		origin,
	}) as RoomNameEvent;
};

export const createRoomNameEvent = createEventWithId(roomNameEvent);
