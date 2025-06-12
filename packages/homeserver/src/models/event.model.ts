import type { EventBase as CoreEventBase } from "../core/events/eventBase";

export interface EventBase extends CoreEventBase {
	event_id?: string;
}

export interface EventStore {
	_id: string;
	event: EventBase;
	staged?: boolean;
	outlier?: boolean;
}

export interface StateEvent extends EventBase {
	state_key: string;
}

export interface MessageEvent extends EventBase {
	content: {
		msgtype: string;
		body: string;
		[key: string]: unknown;
	};
}

export interface FetchedEvents {
	events: { eventId: string; event: EventBase }[];
	missingEventIds: string[];
}
