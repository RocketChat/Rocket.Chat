import { createEventBase, type EventBase } from './eventBase';
import { createEventWithId } from './utils/createSignedEvent';

type MessageType =
	| 'm.text'
	| 'm.emote'
	| 'm.notice'
	| 'm.image'
	| 'm.file'
	| 'm.audio'
	| 'm.video'
	| 'm.location';

declare module './eventBase' {
	interface Events {
		'm.room.message': {
			unsigned: {
				age_ts: number;
			};
			content: {
				body: string;
				msgtype: MessageType;
				'm.mentions'?: Record<string, any>;
				format?: string;
				formatted_body?: string;
				'm.relates_to'?: MessageRelation;
				'm.new_content'?: {
					body: string;
					msgtype: MessageType;
					format?: string;
					formatted_body?: string;
				};
			};
		};
	}
}

export type MessageRelation = {
	rel_type: RelationType;
	event_id: string;
} & (RelationTypeReplace | Record<string, never>);

export type RelationType = 'm.replace' | 'm.annotation';

export type RelationTypeReplace = {
	rel_type: 'm.replace';
	event_id: string;
	'm.new_content'?: {
		body: string;
		msgtype: MessageType;
		format?: string;
		formatted_body?: string;
	};
};

export type MessageAuthEvents = {
	'm.room.create': string;
	'm.room.power_levels': string;
	'm.room.member': string;
};

export const isRoomMessageEvent = (
	event: EventBase,
): event is RoomMessageEvent => {
	return event.type === 'm.room.message';
};

export interface RoomMessageEvent extends EventBase {
	type: 'm.room.message';
	content: {
		body: string;
		msgtype: MessageType;
		'm.mentions'?: Record<string, any>;
		format?: string;
		formatted_body?: string;
		'm.relates_to'?: MessageRelation;
		'm.new_content'?: {
			body: string;
			msgtype: MessageType;
			format?: string;
			formatted_body?: string;
		};
	};
	unsigned: {
		age: number;
		age_ts: number;
	};
}

const isTruthy = <T>(
	value: T | null | undefined | false | 0 | '',
): value is T => {
	return Boolean(value);
};

export const roomMessageEvent = ({
	roomId,
	sender,
	auth_events,
	prev_events,
	depth,
	unsigned,
	content,
	origin,
	ts = Date.now(),
}: {
	roomId: string;
	sender: string;
	auth_events: MessageAuthEvents;
	prev_events: string[];
	depth: number;
	unsigned?: RoomMessageEvent['unsigned'];
	content: {
		body: string;
		msgtype: MessageType;
		'm.mentions'?: Record<string, any>;
		format?: string;
		formatted_body?: string;
		'm.relates_to'?: MessageRelation;
		'm.new_content'?: {
			body: string;
			msgtype: MessageType;
			format?: string;
			formatted_body?: string;
		};
	};
	origin?: string;
	ts?: number;
}): RoomMessageEvent => {
	return createEventBase('m.room.message', {
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
		origin_server_ts: ts,
		ts,
		origin,
		unsigned: { age_ts: ts, ...unsigned },
	});
};

export const createRoomMessageEvent = createEventWithId(roomMessageEvent);
