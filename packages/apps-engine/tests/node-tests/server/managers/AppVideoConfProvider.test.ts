import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { IVideoConfProvider } from '../../../../src/definition/videoConfProviders';
import type { ProxiedApp } from '../../../../src/server/ProxiedApp';
import { AppVideoConfProvider } from '../../../../src/server/managers/AppVideoConfProvider';

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
