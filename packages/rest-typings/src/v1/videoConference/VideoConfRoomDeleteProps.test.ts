import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isVideoConfRoomDeleteProps } from './VideoConfRoomDeleteProps';

describe('isVideoConfRoomDeleteProps', () => {
	const valid = { conferenceRoomId: 'link-1' };

	it('accepts a valid body', () => {
		assert.equal(isVideoConfRoomDeleteProps(valid), true);
	});

	it('rejects a missing property', () => {
		const { conferenceRoomId: _conferenceRoomId, ...withoutConferenceRoomId } = valid;
		assert.equal(isVideoConfRoomDeleteProps(withoutConferenceRoomId), false);
	});

	it('rejects an extra property', () => {
		assert.equal(isVideoConfRoomDeleteProps({ ...valid, extra: 'extra' }), false);
	});

	it('rejects a value that is not a string', () => {
		assert.equal(isVideoConfRoomDeleteProps({ ...valid, conferenceRoomId: {} }), false);
		assert.equal(isVideoConfRoomDeleteProps({ ...valid, conferenceRoomId: ['x'] }), false);
	});
});
