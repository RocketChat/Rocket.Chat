import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isVideoConfRoomListProps } from './VideoConfRoomListProps';

describe('isVideoConfRoomListProps', () => {
	const valid = { roomId: 'room-1' };

	it('accepts a valid body', () => {
		assert.equal(isVideoConfRoomListProps(valid), true);
	});

	it('rejects a missing property', () => {
		const { roomId: _roomId, ...withoutRoomId } = valid;
		assert.equal(isVideoConfRoomListProps(withoutRoomId), false);
	});

	it('rejects an extra property', () => {
		assert.equal(isVideoConfRoomListProps({ ...valid, extra: 'extra' }), false);
	});

	it('rejects a value that is not a string', () => {
		assert.equal(isVideoConfRoomListProps({ ...valid, roomId: {} }), false);
		assert.equal(isVideoConfRoomListProps({ ...valid, roomId: ['x', 'y'] }), false);
	});

	// A query value is always a string; an id that looks like a number must stay one.
	it('keeps a numeric-looking roomId a string', () => {
		const query = { roomId: '12345' };
		assert.equal(isVideoConfRoomListProps(query), true);
		assert.equal(typeof query.roomId, 'string');
	});
});
