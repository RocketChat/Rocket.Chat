import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { IMediaCall } from '@rocket.chat/apps-engine/definition/mediaCalls';

import { MediaCallRead } from '../../../src/server/accessors';
import type { MediaCallBridge } from '../../../src/server/bridges';
import { TestData } from '../../test-data/utilities';

describe('MediaCallRead', () => {
	it('expectDataFromMediaCallRead', async () => {
		const call = TestData.getMediaCall();

		const mockMediaCallBridge = {
			doGetById(id, appId): Promise<IMediaCall> {
				return Promise.resolve(call);
			},
		} as MediaCallBridge;

		assert.doesNotThrow(() => new MediaCallRead(mockMediaCallBridge, 'testing-app'));

		const read = new MediaCallRead(mockMediaCallBridge, 'testing-app');

		assert.ok((await read.getById('fake')) !== undefined);
		assert.strictEqual(await read.getById('fake'), call);
	});
});
