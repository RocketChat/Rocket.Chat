import { type EventBase } from './eventBase';

declare module './eventBase' {
	interface Events {
		'm.room.third_party_invite': RoomThirdPartyInviteEvent;
	}
}

export interface RoomThirdPartyInviteEvent extends EventBase {
	type: 'm.room.third_party_invite';
	content: {
		display_name: string;
		public_key?: string;
		public_keys: {
			key_validity_url: string;
			public_key: string;
		}[];
		key_validity_url: string;
	};
	unsigned?: {
		age_ts: number;
	};
}

export const isRoomThirdPartyInviteEvent = (
	event: EventBase,
): event is RoomThirdPartyInviteEvent => {
	return event.type === 'm.room.third_party_invite';
};
