import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { AppVideoConference } from '../../../../src/definition/videoConferences';
import { VideoConferenceBuilder } from '../../../../src/server/accessors';
import { TestData } from '../../../test-data/utilities';

describe('VideoConferenceBuilder', () => {
	it('basicVideoConferenceBuilderBuilder', () => {
		assert.doesNotThrow(() => new VideoConferenceBuilder());
		assert.doesNotThrow(() => new VideoConferenceBuilder(TestData.getAppVideoConference()));
	});

	it('setData', () => {
		const builder = new VideoConferenceBuilder();

		assert.strictEqual(builder.setData({ providerName: 'test-provider' } as AppVideoConference), builder);
		assert.strictEqual(((builder as any).call as AppVideoConference).providerName, 'test-provider');
	});

	it('setRoomId', () => {
		const call = {} as AppVideoConference;
		const builder = new VideoConferenceBuilder(call);

		assert.strictEqual(builder.setRoomId('roomId'), builder);
		assert.strictEqual(call.rid, 'roomId');
		assert.strictEqual(builder.getRoomId(), 'roomId');

		assert.strictEqual(builder.getVideoConference(), call);
	});

	it('setCreatedBy', () => {
		const call = {} as AppVideoConference;
		const builder = new VideoConferenceBuilder(call);

		assert.strictEqual(builder.setCreatedBy('userId'), builder);
		assert.strictEqual(call.createdBy, 'userId');
		assert.strictEqual(builder.getCreatedBy(), 'userId');

		assert.strictEqual(builder.getVideoConference(), call);
	});

	it('setProviderName', () => {
		const call = {} as AppVideoConference;
		const builder = new VideoConferenceBuilder(call);

		assert.strictEqual(builder.setProviderName('test'), builder);
		assert.strictEqual(call.providerName, 'test');
		assert.strictEqual(builder.getProviderName(), 'test');

		assert.strictEqual(builder.getVideoConference(), call);
	});

	it('setProviderData', () => {
		const call = {} as AppVideoConference;
		const builder = new VideoConferenceBuilder(call);

		assert.strictEqual(builder.setProviderData({ custom: true }), builder);
		assert.deepStrictEqual(call.providerData, { custom: true });
		assert.deepStrictEqual(builder.getProviderData(), { custom: true });

		assert.strictEqual(builder.getVideoConference(), call);
	});

	it('setTitle', () => {
		const call = {} as AppVideoConference;
		const builder = new VideoConferenceBuilder(call);

		assert.strictEqual(builder.setTitle('Video Conference'), builder);
		assert.strictEqual(call.title, 'Video Conference');
		assert.strictEqual(builder.getTitle(), 'Video Conference');

		assert.strictEqual(builder.getVideoConference(), call);
	});

	it('setDiscussionRid', () => {
		const call = {} as AppVideoConference;
		const builder = new VideoConferenceBuilder(call);

		assert.strictEqual(builder.setDiscussionRid('testId'), builder);
		assert.strictEqual(call.discussionRid, 'testId');
		assert.strictEqual(builder.getDiscussionRid(), 'testId');

		assert.strictEqual(builder.getVideoConference(), call);
	});

	it('initialData', () => {
		const call = { providerName: 'test' } as AppVideoConference;
		const builder = new VideoConferenceBuilder(call);

		assert.strictEqual(call.providerName, 'test');
		assert.strictEqual(builder.getProviderName(), 'test');

		assert.strictEqual(builder.setProviderName('test2'), builder);
		assert.strictEqual(call.providerName, 'test2');
		assert.strictEqual(builder.getProviderName(), 'test2');

		assert.strictEqual(builder.getVideoConference(), call);
	});
});
