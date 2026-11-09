import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { IVideoConfProvider } from '@rocket.chat/apps-engine/definition/videoConfProviders/index.js';

import type { ProxiedApp } from '../../../src/server/ProxiedApp.js';
import { AppVideoConfProvider } from '../../../src/server/managers/AppVideoConfProvider.js';

describe('AppVideoConfProvider', () => {
	it('ensureAppVideoConfManager', () => {
		const mockApp = {} as ProxiedApp;

		assert.doesNotThrow(() => new AppVideoConfProvider(mockApp, {} as IVideoConfProvider));

		const ascr = new AppVideoConfProvider(mockApp, {} as IVideoConfProvider);
		assert.strictEqual(ascr.isRegistered, false);

		ascr.hasBeenRegistered();
		assert.strictEqual(ascr.isRegistered, true);
	});
});
