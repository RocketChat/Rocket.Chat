import { createEventBase, type EventBase } from './eventBase';
import { createEventWithId } from './utils/createSignedEvent';

declare module './eventBase' {
	interface Events {
		'm.reaction': {
			content: {
				'm.relates_to': {
					rel_type: 'm.annotation';
					event_id: string;
					key: string;
				};
			};
			unsigned: {
				age_ts: number;
			};
		};
	}
}

export type ReactionAuthEvents = {
	'm.room.create': string | undefined;
	'm.room.power_levels': string | undefined;
	'm.room.member': string | undefined;
};

export const isReactionEvent = (event: EventBase): event is ReactionEvent => {
	return event.type === 'm.reaction';
};

export interface ReactionEvent extends EventBase {
	type: 'm.reaction';
	content: {
		'm.relates_to': {
			rel_type: 'm.annotation';
			event_id: string;
			key: string;
		};
	};
	unsigned: {
		age_ts: number;
	};
}

const isTruthy = <T>(
	value: T | null | undefined | false | 0 | '',
): value is T => {
	return Boolean(value);
};

export const reactionEvent = ({
	roomId,
	sender,
	auth_events,
	prev_events,
	depth,
	content,
	origin,
	ts = Date.now(),
	unsigned,
}: {
	roomId: string;
	sender: string;
	auth_events: ReactionAuthEvents;
	prev_events: string[];
	depth: number;
	content: {
		'm.relates_to': {
			rel_type: 'm.annotation';
			event_id: string;
			key: string;
		};
	};
	origin?: string;
	ts?: number;
	unsigned?: { age_ts?: number };
}): ReactionEvent => {
	return createEventBase('m.reaction', {
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
		unsigned: { ...unsigned, age_ts: ts },
	});
};

export const createReactionEvent = createEventWithId(reactionEvent);
