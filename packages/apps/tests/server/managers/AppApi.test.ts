import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { IApiEndpoint } from '@rocket.chat/apps-engine/definition/api/IApiEndpoint.js';
import type { IApi } from '@rocket.chat/apps-engine/definition/api/index.js';

import type { ProxiedApp } from '../../../src/server/ProxiedApp.js';
import { AppApi } from '../../../src/server/managers/AppApi.js';

describe('AppApi', () => {
	it('ensureAppApi', () => {
		const mockApp = {
			getID() {
				return 'id';
			},
		} as ProxiedApp;

		assert.doesNotThrow(() => new AppApi(mockApp, {} as IApi, {} as IApiEndpoint));

		const ascr = new AppApi(mockApp, {} as IApi, {} as IApiEndpoint);
		assert.ok(ascr.app !== undefined);
		assert.ok(ascr.api !== undefined);
	});
});
