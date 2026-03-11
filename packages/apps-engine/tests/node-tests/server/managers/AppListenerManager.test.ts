import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { AppInterface } from '../../../../src/definition/metadata';
import type { AppManager } from '../../../../src/server/AppManager';
import type { ProxiedApp } from '../../../../src/server/ProxiedApp';
import { AppListenerManager } from '../../../../src/server/managers';

describe('AppListenerManager', () => {
	const mockApp = {
		getID() {
			return 'testing';
		},
		getImplementationList() {
			return {
				[AppInterface.IPostMessageSent]: true,
			} as { [inte: string]: boolean };
		},
	} as ProxiedApp;

	const mockManager = {
		getAccessorManager() {},
		getOneById(appId: string) {
			return mockApp;
		},
	} as AppManager;

	it('basicAppListenerManager', () => {
		assert.doesNotThrow(() => new AppListenerManager(mockManager));

		const alm = new AppListenerManager(mockManager);

		assert.strictEqual(alm.getListeners(AppInterface.IPostMessageSent).length, 0);
		assert.doesNotThrow(() => alm.registerListeners(mockApp));
		assert.strictEqual(alm.getListeners(AppInterface.IPostMessageSent).length, 1);
	});
});
