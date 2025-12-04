import * as assert from 'node:assert';
import { describe, it, mock } from 'node:test';

import type { ISetting } from '../../../../src/definition/settings';
import { ServerSettingsModify } from '../../../../src/server/accessors';
import type { ServerSettingBridge } from '../../../../src/server/bridges';
import { TestData } from '../../../test-data/utilities';

describe('ServerSettingsModify', () => {
	it('useServerSettingsModify', async () => {
		const setting = TestData.getSetting();
		const mockAppId = 'testing-app';
		const mockServerSettingBridge = {
			doHideGroup(name: string, appId: string): Promise<void> {
				return Promise.resolve();
			},
			doHideSetting(id: string, appId: string): Promise<void> {
				return Promise.resolve();
			},
			doUpdateOne(setting: ISetting, appId: string): Promise<void> {
				return Promise.resolve();
			},
			doIncrementValue(id: ISetting['id'], value: number, appId: string): Promise<void> {
				return Promise.resolve();
			},
		} as ServerSettingBridge;

		assert.doesNotThrow(() => new ServerSettingsModify(mockServerSettingBridge, mockAppId));

		const hideGroupSpy = mock.method(mockServerSettingBridge, 'doHideGroup');
		const hideSettingSpy = mock.method(mockServerSettingBridge, 'doHideSetting');
		const updateOneSpy = mock.method(mockServerSettingBridge, 'doUpdateOne');
		const incrementValueSpy = mock.method(mockServerSettingBridge, 'doIncrementValue');

		const ssm = new ServerSettingsModify(mockServerSettingBridge, mockAppId);

		assert.ok((await ssm.hideGroup('api')) === undefined);
		assert.strictEqual(hideGroupSpy.mock.calls.length, 1);
		assert.deepStrictEqual(hideGroupSpy.mock.calls[0].arguments, ['api', mockAppId]);
		
		assert.ok((await ssm.hideSetting('api')) === undefined);
		assert.strictEqual(hideSettingSpy.mock.calls.length, 1);
		assert.deepStrictEqual(hideSettingSpy.mock.calls[0].arguments, ['api', mockAppId]);
		
		assert.ok((await ssm.modifySetting(setting)) === undefined);
		assert.strictEqual(updateOneSpy.mock.calls.length, 1);
		assert.deepStrictEqual(updateOneSpy.mock.calls[0].arguments, [setting, mockAppId]);
		
		assert.ok((await ssm.incrementValue(setting.id, 5)) === undefined);
		assert.strictEqual(incrementValueSpy.mock.calls.length, 1);
		assert.deepStrictEqual(incrementValueSpy.mock.calls[0].arguments, [setting.id, 5, mockAppId]);
	});
});
