import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isVideoConfScheduleProps } from './VideoConfScheduleProps';

const request = { email: 'requester@example.com', invitees: ['guest@example.com'], sipAlias: true };

/**
 * What this schema says that the others don't: the add-in always states whether it wants an alias, and the title
 * is the one thing it may leave out.
 */
describe('isVideoConfScheduleProps', () => {
	it('accepts a request with or without a title', () => {
		assert.equal(isVideoConfScheduleProps(request), true);
		assert.equal(isVideoConfScheduleProps({ ...request, title: 'Weekly sync' }), true);
	});

	// A meeting nobody else was invited to is still a meeting.
	it('accepts an empty invitee list', () => {
		assert.equal(isVideoConfScheduleProps({ ...request, invitees: [] }), true);
	});

	// Silence is not "no alias": the add-in showed the choice, so it has to report it.
	it('rejects a request that does not say whether it wants an alias', () => {
		const { sipAlias: _, ...withoutAlias } = request;

		assert.equal(isVideoConfScheduleProps(withoutAlias), false);
	});

	it('rejects an empty address', () => {
		assert.equal(isVideoConfScheduleProps({ ...request, email: '' }), false);
		assert.equal(isVideoConfScheduleProps({ ...request, invitees: [''] }), false);
	});
});
