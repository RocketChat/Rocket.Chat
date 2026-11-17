import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isVideoConfJoinScheduledProps } from './VideoConfJoinScheduledProps';

/** What this schema says that the others don't: a link names either the number dialled or the booking, never both. */
describe('isVideoConfJoinScheduledProps', () => {
	it('accepts an alias or a booking', () => {
		assert.equal(isVideoConfJoinScheduledProps({ sipAlias: '12345678' }), true);
		assert.equal(isVideoConfJoinScheduledProps({ scheduledConferenceId: 'booking1' }), true);
	});

	// Either one could be the one the server acts on, so the caller has to settle which it means.
	it('rejects both at once', () => {
		assert.equal(isVideoConfJoinScheduledProps({ sipAlias: '12345678', scheduledConferenceId: 'booking1' }), false);
	});

	it('rejects neither', () => {
		assert.equal(isVideoConfJoinScheduledProps({}), false);
	});
});
