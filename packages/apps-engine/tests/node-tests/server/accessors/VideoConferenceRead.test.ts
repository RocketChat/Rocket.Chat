import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { VideoConference } from '../../../../src/definition/videoConferences';
import { VideoConferenceRead } from '../../../../src/server/accessors';
import type { VideoConferenceBridge } from '../../../../src/server/bridges';
import { TestData } from '../../../test-data/utilities';

describe('VideoConferenceRead', () => {
	it('expectDataFromVideoConferenceRead', async () => {
		const videoConference = TestData.getVideoConference();

		const call = videoConference;
		const mockVideoConfBridge = {
			doGetById(id, appId): Promise<VideoConference> {
				return Promise.resolve(call);
			},
		} as VideoConferenceBridge;

		assert.doesNotThrow(() => new VideoConferenceRead(mockVideoConfBridge, 'testing-app'));

		const read = new VideoConferenceRead(mockVideoConfBridge, 'testing-app');

		assert.ok((await read.getById('fake')) !== undefined);
		assert.strictEqual(await read.getById('fake'), videoConference);
	});
});
