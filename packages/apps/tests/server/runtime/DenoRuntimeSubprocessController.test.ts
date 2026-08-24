/* eslint-disable dot-notation -- we avoid the dot notation here when testing private methods */

import * as assert from 'node:assert';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { describe, it, afterEach, mock, before, after } from 'node:test';

import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';

import { request, SuccessObject } from '../../../src/lib/jsonrpc';
import type { AppManager } from '../../../src/server/AppManager';
import type { IParseAppPackageResult } from '../../../src/server/compiler';
import { AppApiManager } from '../../../src/server/managers';
import { DenoRuntimeSubprocessController } from '../../../src/server/runtime/deno/AppsEngineDenoRuntime';
import type { IAppStorageItem } from '../../../src/server/storage';
import { TestInfastructureSetup } from '../../test-data/utilities';

describe('DenoRuntimeSubprocessController', () => {
	let manager: AppManager;
	let controller: DenoRuntimeSubprocessController;
	let appPackage: IParseAppPackageResult;
	let appStorageItem: IAppStorageItem;

	before(
		async () => {
			const infrastructure = new TestInfastructureSetup();
			manager = infrastructure.getMockManager();

			const api = new AppApiManager(manager);
			manager.getApiManager = () => api;

			const appPackageBuffer = await fs.readFile(path.join(__dirname, '../../test-data/apps/hello-world-test_0.0.1.zip'));
			appPackage = await manager.getParser().unpackageApp(appPackageBuffer);

			await fs.unlink(path.join(manager.getTempFilePath(), 'deno-runtime')).catch(function noop() {});

			appStorageItem = {
				id: 'hello-world-test',
				status: AppStatus.MANUALLY_ENABLED,
			} as IAppStorageItem;

			controller = new DenoRuntimeSubprocessController(manager, appPackage, appStorageItem);
			await controller.setupApp();
		},
		{ timeout: 60_000 },
	);

	afterEach(() => {
		mock.restoreAll();
	});

	after(
		async () => {
			await controller?.stopApp();
			await fs.unlink(path.join(manager.getTempFilePath(), 'deno-runtime')).catch((reason) => {
				console.warn('Failed to delete temporary Deno runtime symlink', reason);
			});
		},
		{ timeout: 30_000 },
	);

	it('correctly identifies a call to the message bridge', { timeout: 15_000 }, async () => {
		const messageBridge = manager.getBridges().getMessageBridge();
		const doCreateSpy = mock.method(messageBridge, 'doCreate', () => Promise.resolve('random-message-id'));

		const messageParam = {
			room: { id: '123' },
			sender: { id: '456' },
			text: 'Hello World',
			alias: 'alias',
			avatarUrl: 'https://avatars.com/123',
		};

		const response = await controller['handleBridgeMessage'](
			request('requestId', 'bridges:getMessageBridge:doCreate', [messageParam, 'APP_ID']),
		);

		assert.ok(response instanceof SuccessObject);

		const { id, result } = response;

		assert.strictEqual(doCreateSpy.mock.calls.length, 1);
		assert.deepStrictEqual(doCreateSpy.mock.calls[0].arguments, [messageParam, '9c1d62ca-e40f-456f-8601-17c823a16c68']);

		assert.strictEqual(id, 'requestId');
		assert.strictEqual(result, 'random-message-id');
	});
});
