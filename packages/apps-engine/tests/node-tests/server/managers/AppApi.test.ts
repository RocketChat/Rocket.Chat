import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { IApi } from '../../../../src/definition/api';
import type { IApiEndpoint } from '../../../../src/definition/api/IApiEndpoint';
import type { ProxiedApp } from '../../../../src/server/ProxiedApp';
import { AppApi } from '../../../../src/server/managers/AppApi';

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
