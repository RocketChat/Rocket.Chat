import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isVideoConfRoomCreateProps } from './VideoConfRoomCreateProps';

describe('isVideoConfRoomCreateProps', () => {
	const valid = { roomId: 'room-1', title: 'Weekly sync' };

	it('accepts a valid body', () => {
		assert.equal(isVideoConfRoomCreateProps(valid), true);
	});

	it('rejects a missing property', () => {
		const { roomId: _roomId, ...withoutRoomId } = valid;
		assert.equal(isVideoConfRoomCreateProps(withoutRoomId), false);
		const { title: _title, ...withoutTitle } = valid;
		assert.equal(isVideoConfRoomCreateProps(withoutTitle), false);
	});

	it('rejects an extra property', () => {
		assert.equal(isVideoConfRoomCreateProps({ ...valid, extra: 'extra' }), false);
	});

	it('rejects a value that is not a string', () => {
		assert.equal(isVideoConfRoomCreateProps({ ...valid, roomId: {} }), false);
		assert.equal(isVideoConfRoomCreateProps({ ...valid, roomId: ['x'] }), false);
		assert.equal(isVideoConfRoomCreateProps({ ...valid, title: {} }), false);
		assert.equal(isVideoConfRoomCreateProps({ ...valid, title: ['x'] }), false);
	});

	it('takes a title of 1 to 200 characters', () => {
		assert.equal(isVideoConfRoomCreateProps({ ...valid, title: '' }), false);
		assert.equal(isVideoConfRoomCreateProps({ ...valid, title: 'a'.repeat(201) }), false);
		assert.equal(isVideoConfRoomCreateProps({ ...valid, title: 'a'.repeat(200) }), true);
	});
});
