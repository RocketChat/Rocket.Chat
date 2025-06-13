export type EventBase = {
	auth_events: string[];
	prev_events: string[];
	type:
		| 'm.room.member'
		| 'm.room.create'
		| 'm.room.join_rules'
		| 'm.room.power_levels'
		| 'm.room.aliases'
		| 'm.room.history_visibility'
		| 'm.room.redaction'
		| 'm.reaction'
		| string;
	room_id: string;
	sender: string;
	depth: number;
	state_key?: string;
	origin: string;
	origin_server_ts: number;

	content?: Record<string, unknown>;
	unsigned?: Record<string, any> | undefined;
};

export interface Events {}

type KeyEvent = keyof Events;

export const createEventBase = <T extends KeyEvent>(
	type: T,
	props: {
		roomId: string;
		sender: string;
		auth_events?: string[];
		prev_events?: string[];
		depth: number;
		content: Events[T]['content'];
		state_key?: string;
		origin_server_ts: number;
		unsigned?: Events[T]['unsigned'];
		origin?: string;
		ts?: number;
	},
): Events[T] extends EventBase ? Events[T] : never => {
	return _createEventBase<
		Events[T] extends EventBase ? Events[T] : never,
		Events[T]['content'],
		Events[T]['unsigned']
	>({
		type,
		...props,
	});
};

const _createEventBase = <
	E extends EventBase,
	TContent extends EventBase['content'],
	TUnsigned extends EventBase['unsigned'],
>({
	roomId,
	sender,
	auth_events = [],
	prev_events = [],
	depth,
	type,
	content,
	state_key,
	origin_server_ts,
	unsigned,
	origin,
	ts = Date.now(),
}: {
	roomId: string;
	sender: string;
	auth_events?: string[];
	prev_events?: string[];
	depth: number;
	type: string;
	content?: TContent;
	state_key?: string;
	origin_server_ts: number;
	unsigned?: TUnsigned;
	origin?: string;
	ts?: number;
}): E & {
	unsigned: E['unsigned'] extends void
		? { age_ts: number }
		: E['unsigned'] & { age_ts: number };
} => {
	if (!sender.includes(':') || !sender.includes('@')) {
		throw new Error('Invalid sender');
	}
	if (!roomId.includes(':') || !roomId.includes('!')) {
		throw new Error('Invalid room Id');
	}

	const { age_ts = ts, ..._unsigned } = unsigned || {};
	return {
		auth_events,
		prev_events,
		type,
		room_id: roomId,
		sender,
		depth,
		state_key,
		origin: origin || (sender.split(':').pop() as string),
		origin_server_ts,

		...(content && { content }),
		unsigned: { age_ts: ts, ..._unsigned },
	} as any;
};
