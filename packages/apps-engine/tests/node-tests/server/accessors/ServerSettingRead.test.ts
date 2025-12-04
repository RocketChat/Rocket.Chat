import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { ISetting } from '../../../../src/definition/settings';
import { ServerSettingRead } from '../../../../src/server/accessors';
import type { ServerSettingBridge } from '../../../../src/server/bridges';
import { TestData } from '../../../test-data/utilities';

describe('ServerSettingRead', () => {
	it('expectDataFromRoomRead', async () => {
		const setting = TestData.getSetting('testing');

		const theSetting = setting;
		const mockServerSettingBridge = {
			doGetOneById(id: string, appId: string): Promise<ISetting> {
				return Promise.resolve(id === 'testing' ? theSetting : undefined);
			},
			doIsReadableById(id: string, appId: string): Promise<boolean> {
				return Promise.resolve(true);
			},
		} as ServerSettingBridge;

		assert.doesNotThrow(() => new ServerSettingRead(mockServerSettingBridge, 'testing-app'));

		const ssr = new ServerSettingRead(mockServerSettingBridge, 'testing-app');

		assert.ok((await ssr.getOneById('testing')) !== undefined);
		assert.deepStrictEqual(await ssr.getOneById('testing'), setting);
		assert.deepStrictEqual(await ssr.getValueById('testing'), setting.packageValue);
		setting.value = 'theValue';
		assert.strictEqual(await ssr.getValueById('testing'), 'theValue');
		await assert.rejects(
			async () => ssr.getValueById('fake'),
			{
				name: 'Error',
				message: 'No Server Setting found, or it is unaccessible, by the id of "fake".',
			},
		);
		await assert.rejects(() => ssr.getAll(), {
			name: 'Error',
			message: 'Method not implemented.',
		});
		assert.strictEqual(await ssr.isReadableById('testing'), true);
	});
});
