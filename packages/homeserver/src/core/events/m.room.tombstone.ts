import { createEventBase, type EventBase } from './eventBase';
import { createEventWithId } from './utils/createSignedEvent';

export interface RoomTombstoneEvent extends EventBase {
	type: 'm.room.tombstone';
	state_key: '';
	content: {
		body: string;
		replacement_room?: string;
	};
	unsigned: {
		age_ts: number;
	};
}

declare module './eventBase' {
	interface Events {
		'm.room.tombstone': RoomTombstoneEvent;
	}
}

export type TombstoneAuthEvents = {
	'm.room.create': string | undefined;
	'm.room.power_levels': string | undefined;
	'm.room.member': string | undefined;
};

type RoomTombstoneEventProps = {
	roomId: string;
	sender: string;
	body: string;
	replacementRoom?: string;
	auth_events: TombstoneAuthEvents;
	prev_events: string[];
	depth: number;
	ts?: number;
	origin?: string;
};

const isTruthy = <T>(
	value: T | null | undefined | false | 0 | '',
): value is T => {
	return Boolean(value);
};

export const roomTombstoneEvent = ({
	roomId,
	sender,
	body,
	replacementRoom,
	auth_events,
	prev_events,
	depth,
	origin,
	ts = Date.now(),
}: RoomTombstoneEventProps): RoomTombstoneEvent => {
	const content: RoomTombstoneEvent['content'] = {
		body,
	};

	if (replacementRoom) {
		content.replacement_room = replacementRoom;
	}

	return createEventBase('m.room.tombstone', {
		roomId,
		sender,
		auth_events: [
			auth_events['m.room.create'],
			auth_events['m.room.power_levels'],
			auth_events['m.room.member'],
		].filter(isTruthy),
		prev_events,
		depth,
		content,
		state_key: '',
		origin_server_ts: ts,
		ts,
		origin,
		unsigned: { age_ts: ts },
	});
};

export const createRoomTombstoneEvent = createEventWithId(roomTombstoneEvent);

export const isRoomTombstoneEvent = (
	event: EventBase | null | undefined,
): event is RoomTombstoneEvent =>
	Boolean(
		event && typeof event === 'object' && event.type === 'm.room.tombstone',
	);
