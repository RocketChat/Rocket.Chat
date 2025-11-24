import * as fs from 'fs/promises';
import * as path from 'path';
import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import * as assert from 'node:assert';

import { AppStatus } from '../../../../src/definition/AppStatus';
import { UserStatusConnection, UserType } from '../../../../src/definition/users';
import type { AppManager } from '../../../../src/server/AppManager';
import type { IParseAppPackageResult } from '../../../../src/server/compiler';
import { AppAccessorManager, AppApiManager } from '../../../../src/server/managers';
import { DenoRuntimeSubprocessController } from '../../../../src/server/runtime/deno/AppsEngineDenoRuntime';
import type { IAppStorageItem } from '../../../../src/server/storage';
import { TestInfastructureSetup } from '../../../test-data/utilities';

describe('DenoRuntimeSubprocessController', () => {
	let manager: AppManager;
	let controller: DenoRuntimeSubprocessController;
	let appPackage: IParseAppPackageResult;
	let appStorageItem: IAppStorageItem;

	beforeEach(async () => {
		const infrastructure = new TestInfastructureSetup();
		manager = infrastructure.getMockManager();

		const accessors = new AppAccessorManager(manager);
		manager.getAccessorManager = () => accessors;

		const api = new AppApiManager(manager);
		manager.getApiManager = () => api;

		const appPackageBuffer = await fs.readFile(path.join(__dirname, '../../../test-data/apps/hello-world-test_0.0.1.zip'));
		appPackage = await manager.getParser().unpackageApp(appPackageBuffer);

		appStorageItem = {
			id: 'hello-world-test',
			status: AppStatus.MANUALLY_ENABLED,
		} as IAppStorageItem;

		controller = new DenoRuntimeSubprocessController(manager, appPackage, appStorageItem);
		await controller.setupApp();
	});

	afterEach(async () => {
		await controller.stopApp();
		mock.restoreAll();
	});

	it('correctly identifies a call to the HTTP accessor', async () => {
		const httpBridge = manager.getBridges().getHttpBridge();
		const doCallSpy = mock.method(httpBridge, 'doCall');

		// eslint-disable-next-line
		const r = await (controller as any).handleAccessorMessage({
			type: 'request',
			payload: {
				jsonrpc: '2.0',
				id: 'test',
				method: 'accessor:getHttp:get',
				params: ['https://google.com', { content: "{ test: 'test' }" }],
				serialize: () => '',
			},
		});

		assert.strictEqual(doCallSpy.mock.calls.length, 1, 'doCallSpy.mock.calls.length');
		const callArgs = doCallSpy.mock.calls[0].arguments;
		assert.partialDeepStrictEqual(callArgs[0], {
			appId: '9c1d62ca-e40f-456f-8601-17c823a16c68',
			method: 'get',
			url: 'https://google.com',
		}, 'callArgs[0]');

		assert.deepStrictEqual(r.result, {
			method: 'get',
			url: 'https://google.com',
			content: "{ test: 'test' }",
			statusCode: 200,
			headers: {},
		}, 'r.result');
	});

	it('correctly identifies a call to the IRead accessor', async () => {
		const userBridge = manager.getBridges().getUserBridge();
		const doGetByUsernameSpy = mock.method(userBridge, 'doGetByUsername', () =>
			Promise.resolve({
				id: 'id',
				username: 'rocket.cat',
				isEnabled: true,
				emails: [],
				name: 'name',
				roles: [],
				type: UserType.USER,
				active: true,
				utcOffset: 0,
				status: 'offline',
				statusConnection: UserStatusConnection.OFFLINE,
				lastLoginAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		);

		// eslint-disable-next-line
		const { id, result } = await (controller as any).handleAccessorMessage({
			type: 'request',
			payload: {
				jsonrpc: '2.0',
				id: 'test',
				method: 'accessor:getReader:getUserReader:getByUsername',
				params: ['rocket.cat'],
				serialize: () => '',
			},
		});

		assert.strictEqual(doGetByUsernameSpy.mock.calls.length, 1);
		assert.deepStrictEqual(doGetByUsernameSpy.mock.calls[0].arguments, ['rocket.cat', '9c1d62ca-e40f-456f-8601-17c823a16c68']);

		assert.strictEqual(id, 'test');
		assert.strictEqual((result as any).username, 'rocket.cat');
	});

	it('correctly identifies a call to the IEnvironmentReader accessor via IRead', async () => {
		// eslint-disable-next-line
		const { id, result } = await (controller as any).handleAccessorMessage({
			type: 'request',
			payload: {
				jsonrpc: '2.0',
				id: 'requestId',
				method: 'accessor:getReader:getEnvironmentReader:getServerSettings:getOneById',
				params: ['setting test id'],
				serialize: () => '',
			},
		});

		assert.strictEqual(id, 'requestId');
		assert.strictEqual((result as any).id, 'setting test id');
	});

	it('correctly identifies a call to create a visitor via the LivechatCreator', async () => {
		const livechatBridge = manager.getBridges().getLivechatBridge();
		const doCreateVisitorSpy = mock.method(livechatBridge, 'doCreateVisitor', () => Promise.resolve('random id'));

		// eslint-disable-next-line
		const { id, result } = await (controller as any).handleAccessorMessage({
			type: 'request',
			payload: {
				jsonrpc: '2.0',
				id: 'requestId',
				method: 'accessor:getModifier:getCreator:getLivechatCreator:createVisitor',
				params: [
					{
						id: 'random id',
						token: 'random token',
						username: 'random username for visitor',
						name: 'Random Visitor',
					},
				],
				serialize: () => '',
			},
		});

		assert.strictEqual(doCreateVisitorSpy.mock.calls.length, 1);
		assert.deepStrictEqual(doCreateVisitorSpy.mock.calls[0].arguments, [
			{
				id: 'random id',
				token: 'random token',
				username: 'random username for visitor',
				name: 'Random Visitor',
			},
			'9c1d62ca-e40f-456f-8601-17c823a16c68',
		]);

		assert.strictEqual(id, 'requestId');
		assert.strictEqual(result, 'random id');
	});

	it('correctly identifies a call to the message bridge', async () => {
		const messageBridge = manager.getBridges().getMessageBridge();
		const doCreateSpy = mock.method(messageBridge, 'doCreate', () => Promise.resolve('random-message-id'));

		const messageParam = {
			room: { id: '123' },
			sender: { id: '456' },
			text: 'Hello World',
			alias: 'alias',
			avatarUrl: 'https://avatars.com/123',
		};

		// eslint-disable-next-line
		const response = await (controller as any).handleBridgeMessage({
			type: 'request',
			payload: {
				jsonrpc: '2.0',
				id: 'requestId',
				method: 'bridges:getMessageBridge:doCreate',
				params: [messageParam, 'APP_ID'],
				serialize: () => '',
			},
		});
		const { id, result } = response as any;

		assert.strictEqual(doCreateSpy.mock.calls.length, 1);
		assert.deepStrictEqual(doCreateSpy.mock.calls[0].arguments, [messageParam, '9c1d62ca-e40f-456f-8601-17c823a16c68']);

		assert.strictEqual(id, 'requestId');
		assert.strictEqual(result, 'random-message-id');
	});
});
