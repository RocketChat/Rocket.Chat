import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { VideoConference } from '../../../../src/definition/videoConferences';
import { VideoConferenceExtender } from '../../../../src/server/accessors';
import { TestData } from '../../../test-data/utilities';

describe('VideoConferenceExtend', () => {
	it('basicVideoConferenceExtend', () => {
		assert.doesNotThrow(() => new VideoConferenceExtender({} as VideoConference));
		assert.doesNotThrow(() => new VideoConferenceExtender(TestData.getVideoConference()));
	});

	it('setProviderData', () => {
		const call = {} as VideoConference;
		const extend = new VideoConferenceExtender(call);

		assert.strictEqual(call.providerData, undefined);
		assert.strictEqual(extend.setProviderData({ key: 'test' }), extend);
		assert.ok(call.providerData !== undefined);
		assert.strictEqual(call.providerData.key, 'test');

		assert.notStrictEqual(extend.getVideoConference(), call);
		assert.deepStrictEqual(extend.getVideoConference(), call);
	});

	it('setStatus', () => {
		const call = { status: 0 } as VideoConference;
		const extend = new VideoConferenceExtender(call);

		assert.strictEqual(call.status, 0);
		assert.strictEqual(extend.setStatus(1), extend);
		assert.strictEqual(call.status, 1);
	});

	it('setEndedBy', () => {
		const call = {} as VideoConference;
		const extend = new VideoConferenceExtender(call);

		assert.strictEqual(call.endedBy, undefined);
		assert.strictEqual(extend.setEndedBy('userId'), extend);
		assert.ok(call.endedBy !== undefined);
		assert.strictEqual(call.endedBy._id, 'userId');
	});

	it('setEndedAt', () => {
		const call = {} as VideoConference;
		const extend = new VideoConferenceExtender(call);

		const date = new Date();

		assert.strictEqual(call.endedAt, undefined);
		assert.strictEqual(extend.setEndedAt(date), extend);
		assert.strictEqual(call.endedAt, date);
	});

	it('setDiscussionRid', () => {
		const call = {} as VideoConference;
		const extend = new VideoConferenceExtender(call);

		assert.strictEqual(call.discussionRid, undefined);
		assert.strictEqual(extend.setDiscussionRid('testId'), extend);
		assert.strictEqual(call.discussionRid, 'testId');
	});

	it('addUser', () => {
		const call = { users: [] } as VideoConference;
		const extend = new VideoConferenceExtender(call);

		assert.strictEqual(call.users.length, 0);
		assert.strictEqual(extend.addUser('userId'), extend);
		assert.ok(call.users.length > 0);
		assert.strictEqual(call.users[0]._id, 'userId');
	});
});
