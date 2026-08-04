import * as assert from 'node:assert';
import { after, beforeEach, describe, it } from 'node:test';

import { AppObjectRegistry } from '../../AppObjectRegistry';
import { AppAccessors } from '../../lib/accessors/mod';
import handleScheduler from '../scheduler-handler';
import { createMockApp, createMockRequest } from './helpers/mod';

describe('handlers > scheduler', () => {
	const mockAppAccessors = new AppAccessors(() =>
		Promise.resolve({
			id: 'mockId',
			result: {},
			jsonrpc: '2.0',
			serialize: () => '',
		}),
	);

	const mockApp = createMockApp();

	beforeEach(() => {
		AppObjectRegistry.clear();
		AppObjectRegistry.set('app', mockApp);
		mockAppAccessors.getConfigurationExtend().scheduler.registerProcessors([
			{
				id: 'mockId',
				processor: () => Promise.resolve(),
			},
		]);
	});

	after(() => {
		AppObjectRegistry.clear();
	});

	it('correctly executes a request to a processor', async () => {
		const result = await handleScheduler(createMockRequest({ method: 'scheduler:mockId', params: [{}] }));

		assert.deepStrictEqual(result, null);
	});
});
