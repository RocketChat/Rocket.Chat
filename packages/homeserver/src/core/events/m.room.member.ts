import { createEventBase, type EventBase } from './eventBase';
import type { JoinRule } from './m.room.join_rules';
import { createEventWithId } from './utils/createSignedEvent';

type Membership = 'join' | 'invite' | 'leave' | 'knock' | 'ban';

declare module './eventBase' {
	interface Events {
		'm.room.member': {
			unsigned: {
				age_ts: number;
			};
			content: {
				join_authorised_via_users_server?: string;
				membership: Membership;
				reason?: string;
			};
		};
	}
}

export type AuthEvents = {
	'm.room.create': string;
	'm.room.power_levels'?: string;
	'm.room.join_rules'?: string;
	'm.room.history_visibility'?: string;
} & {
	[K in `m.room.member:${string}`]?: string;
};

export const isRoomMemberEvent = (
	event: EventBase,
): event is RoomMemberEvent => {
	return event.type === 'm.room.member';
};
export interface RoomMemberEvent extends EventBase {
	type: 'm.room.member';
	content: {
		membership: Membership;
		join_rule: JoinRule;
		join_authorised_via_users_server?: string;
		third_party_invite?: {
			signed: {
				mxid: string;
				token: string;
				signatures: {
					[servername: string]: {
						[protocol: string]: string;
					};
				};
			};
		};
		reason?: string;
	};
	state_key: string;
	unsigned: {
		// TODO: Check what this is
		age: number;
		age_ts: number;
		invite_room_state: (
			| {
					type: 'm.room.join_rules';
					state_key: '';
					content: { join_rule: 'invite' };
					sender: string;
			  }
			| {
					type: 'm.room.create';
					state_key: '';
					content: { room_version: '10'; creator: string };
					sender: string;
			  }
			| {
					type: 'm.room.member';
					state_key: string;
					content: { displayname: 'admin'; membership: 'join' };
					sender: string;
			  }
			| {
					type: 'm.room.name';
					state_key: '';
					content: { name: string };
					sender: string;
			  }
		)[];
	};
}
const isTruthy = <T>(
	value: T | null | undefined | false | 0 | '',
): value is T => {
	return Boolean(value);
};

export const roomMemberEvent = ({
	membership,
	roomId,
	sender,
	state_key,
	auth_events,
	prev_events,
	depth,
	unsigned,
	content,
	origin,
	ts = Date.now(),
}: {
	membership: Membership;
	roomId: string;
	sender: string;
	state_key: string;
	auth_events: AuthEvents;
	prev_events: string[];
	depth: number;
	unsigned?: RoomMemberEvent['unsigned'];
	content?: Record<string, any>;
	origin?: string;
	ts?: number;
}): RoomMemberEvent => {
	return createEventBase('m.room.member', {
		roomId,
		sender,
		auth_events: [
			auth_events['m.room.create'],
			auth_events['m.room.power_levels'],
			auth_events['m.room.join_rules'],
			auth_events['m.room.history_visibility'],
			auth_events[`m.room.member:${state_key}`],
		].filter(isTruthy),
		prev_events,
		depth,
		content: {
			membership,
			...content,
		},
		state_key,
		origin_server_ts: ts,
		ts,
		origin,
		unsigned: { age_ts: ts, ...unsigned },
	});
};

export const createRoomMemberEvent = createEventWithId(roomMemberEvent);
