import { expect, test } from 'bun:test';

import { isRoomThirdPartyInviteEvent } from './m.room.third_party_invite';

test('isRoomThirdPartyInviteEvent', () => {
	const validEvent = {
		type: 'm.room.third_party_invite',
		room_id: '!someRoom:example.org',
		sender: '@user:example.org',
		content: {
			display_name: 'Test User',
			public_keys: [
				{
					key_validity_url: 'https://example.org/valid',
					public_key: 'abcdef',
				},
			],
			key_validity_url: 'https://example.org/valid',
		},
		origin_server_ts: Date.now(),
		state_key: 'someKey',
		auth_events: [],
		prev_events: [],
		depth: 0,
		origin: 'example.org',
	};

	const invalidEvent = {
		...validEvent,
		type: 'm.room.member',
	};

	expect(isRoomThirdPartyInviteEvent(validEvent)).toBe(true);
	expect(isRoomThirdPartyInviteEvent(invalidEvent)).toBe(false);
});
