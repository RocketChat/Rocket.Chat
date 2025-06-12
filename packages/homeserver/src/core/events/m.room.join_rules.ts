import { createEventBase, type EventBase } from './eventBase';
import { createEventWithId } from './utils/createSignedEvent';

declare module './eventBase' {
	interface Events {
		'm.room.join_rules': RoomJoinRulesEvent;
	}
}

export type JoinRule =
	| 'invite'
	| 'knock'
	| 'public'
	| 'restricted'
	| 'knock_restricted';

export interface RoomJoinRulesEvent extends EventBase {
	content: {
		join_rule: JoinRule;
	};
	unsigned?: {
		age_ts: number;
	};
}

export const roomJoinRulesEvent = ({
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
	return createEventBase('m.room.join_rules', {
		roomId,
		sender,
		auth_events,
		prev_events,
		depth,
		content: { join_rule: 'invite' },
		state_key: '',
		ts,
		origin_server_ts: ts,
		unsigned: { age_ts: ts },
	});
};

export const createRoomJoinRulesEvent = createEventWithId(roomJoinRulesEvent);

export const isRoomJoinRulesEvent = (
	event: EventBase,
): event is RoomJoinRulesEvent => {
	return event.type === 'm.room.join_rules';
};
