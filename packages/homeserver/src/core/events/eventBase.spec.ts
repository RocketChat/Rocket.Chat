import { expect, test } from 'bun:test';

import { createEventBase } from './eventBase';

test("eventBase - invalid sender (without ':' )", async () => {
	expect(() =>
		createEventBase('m.room.member', {
			roomId: '',
			sender: 'invalid',
			depth: 1,
			state_key: 'sender',
			content: { membership: 'join' },
			origin_server_ts: 12,
			unsigned: { age_ts: 12 },
		}),
	).toThrow('Invalid sender');
});

test("eventBase - invalid sender (without '@' )", async () => {
	expect(() =>
		createEventBase('m.room.member', {
			roomId: '',
			sender: 'invalid:invalid',
			depth: 1,
			content: { membership: 'join' },
			state_key: 'sender',
			origin_server_ts: 12,
			unsigned: { age_ts: 12 },
		}),
	).toThrow('Invalid sender');
});

test("eventBase - invalid roomId (without '!' )", async () => {
	expect(() =>
		createEventBase('m.room.member', {
			roomId: 'invalid',
			sender: '@valid:valid',
			depth: 1,
			content: { membership: 'join' },
			state_key: 'sender',
			origin_server_ts: 12,
			unsigned: { age_ts: 12 },
		}),
	).toThrow('Invalid room Id');
});

test("eventBase - invalid roomId (without '!' )", async () => {
	expect(() =>
		createEventBase('m.room.member', {
			roomId: 'invalid:invalid',
			sender: '@valid:valid',
			content: { membership: 'join' },
			depth: 1,
			state_key: 'sender',
			origin_server_ts: 12,
			unsigned: { age_ts: 12 },
		}),
	).toThrow('Invalid room Id');
});
