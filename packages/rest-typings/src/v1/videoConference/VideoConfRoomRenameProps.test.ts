import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isVideoConfRoomRenameProps } from './VideoConfRoomRenameProps';

describe('isVideoConfRoomRenameProps', () => {
	const valid = { conferenceRoomId: 'link-1', title: 'Weekly sync' };

	it('accepts a valid body', () => {
		assert.equal(isVideoConfRoomRenameProps(valid), true);
	});

	it('rejects a missing property', () => {
		const { conferenceRoomId: _conferenceRoomId, ...withoutConferenceRoomId } = valid;
		assert.equal(isVideoConfRoomRenameProps(withoutConferenceRoomId), false);
		const { title: _title, ...withoutTitle } = valid;
		assert.equal(isVideoConfRoomRenameProps(withoutTitle), false);
	});

	it('rejects an extra property', () => {
		assert.equal(isVideoConfRoomRenameProps({ ...valid, extra: 'extra' }), false);
	});

	it('rejects a value that is not a string', () => {
		assert.equal(isVideoConfRoomRenameProps({ ...valid, conferenceRoomId: {} }), false);
		assert.equal(isVideoConfRoomRenameProps({ ...valid, conferenceRoomId: ['x'] }), false);
		assert.equal(isVideoConfRoomRenameProps({ ...valid, title: {} }), false);
		assert.equal(isVideoConfRoomRenameProps({ ...valid, title: ['x'] }), false);
	});

	it('takes a title of 1 to 200 characters', () => {
		assert.equal(isVideoConfRoomRenameProps({ ...valid, title: '' }), false);
		assert.equal(isVideoConfRoomRenameProps({ ...valid, title: 'a'.repeat(201) }), false);
		assert.equal(isVideoConfRoomRenameProps({ ...valid, title: 'a'.repeat(200) }), true);
	});
});
