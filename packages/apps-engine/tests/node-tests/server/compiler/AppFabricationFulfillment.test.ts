import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { AppStatus } from '../../../../src/definition/AppStatus';
import type { IAppInfo } from '../../../../src/definition/metadata';
import { AppInterface } from '../../../../src/definition/metadata';
import type { AppManager } from '../../../../src/server/AppManager';
import { ProxiedApp } from '../../../../src/server/ProxiedApp';
import { AppFabricationFulfillment } from '../../../../src/server/compiler';
import { AppPermissions } from '../../../../src/server/permissions/AppPermissions';
import type { IAppStorageItem } from '../../../../src/server/storage';
import { TestData } from '../../../test-data/utilities';

describe('AppFabricationFulfillment', () => {
	it('appFabricationDefinement', () => {
		const expctedInfo: IAppInfo = {
			id: '614055e2-3dba-41fb-be48-c1ff146f5932',
			name: 'Testing App',
			nameSlug: 'testing-app',
			description: 'A Rocket.Chat Application used to test out the various features.',
			version: '0.0.8',
			requiredApiVersion: '>=0.9.6',
			author: {
				name: 'Bradley Hilton',
				homepage: 'https://github.com/RocketChat/Rocket.Chat.Apps-ts-definitions',
				support: 'https://github.com/RocketChat/Rocket.Chat.Apps-ts-definitions/issues',
			},
			classFile: 'TestingApp.ts',
			iconFile: 'testing.jpg',
			implements: [],
			permissions: [],
		};

		assert.doesNotThrow(() => new AppFabricationFulfillment());

		const aff = new AppFabricationFulfillment();
		assert.doesNotThrow(() => aff.setAppInfo(expctedInfo));
		assert.deepStrictEqual(aff.getAppInfo(), expctedInfo);

		const expectedInter: { [key: string]: boolean } = {};
		expectedInter[AppInterface.IPreMessageSentPrevent] = true;
		assert.doesNotThrow(() => aff.setImplementedInterfaces(expectedInter));
		assert.deepStrictEqual(aff.getImplementedInferfaces(), expectedInter);

		const fakeApp = new ProxiedApp(
			{} as AppManager,
			{ status: AppStatus.UNKNOWN } as IAppStorageItem,
			TestData.getMockRuntimeController('unknown'),
		);

		assert.doesNotThrow(() => aff.setApp(fakeApp));
		assert.deepStrictEqual(aff.getApp(), fakeApp);
	});

	it('setAppInfoCreatesDeepClone', () => {
		const originalInfo: IAppInfo = {
			id: 'test-app-id',
			name: 'Test App',
			nameSlug: 'test-app',
			description: 'A test application',
			version: '1.0.0',
			requiredApiVersion: '>=1.0.0',
			author: {
				name: 'Test Author',
				homepage: 'https://example.com',
				support: 'https://example.com/support',
			},
			classFile: 'TestApp.ts',
			iconFile: 'test.jpg',
			implements: [AppInterface.IPreMessageSentPrevent],
			permissions: [AppPermissions.user.read, AppPermissions.user.write],
		};

		const aff = new AppFabricationFulfillment();
		aff.setAppInfo(originalInfo);

		// Verify the stored info is equal to the original
		assert.deepStrictEqual(aff.getAppInfo(), originalInfo);

		// Verify that modifying the original object doesn't affect the stored copy
		originalInfo.name = 'Modified Name';
		originalInfo.author.name = 'Modified Author';
		originalInfo.implements.push(AppInterface.IPostMessageSent);
		originalInfo.permissions.push(AppPermissions.message.write);

		assert.notStrictEqual(aff.getAppInfo().name, 'Modified Name');
		assert.notStrictEqual(aff.getAppInfo().author.name, 'Modified Author');
		assert.ok(!aff.getAppInfo().implements.includes(AppInterface.IPostMessageSent));
		assert.ok(!aff.getAppInfo().permissions.includes(AppPermissions.message.write));

		// Verify the stored copy still has original values
		assert.strictEqual(aff.getAppInfo().name, 'Test App');
		assert.strictEqual(aff.getAppInfo().author.name, 'Test Author');
		assert.deepStrictEqual(aff.getAppInfo().implements, [AppInterface.IPreMessageSentPrevent]);
		assert.deepStrictEqual(aff.getAppInfo().permissions, [AppPermissions.user.read, AppPermissions.user.write]);
	});

	it('setImplementedInterfacesCreatesDeepClone', () => {
		const originalInterfaces: { [int: string]: boolean } = {
			[AppInterface.IPreMessageSentPrevent]: true,
			[AppInterface.IPostMessageSent]: false,
			[AppInterface.IPreMessageSentExtend]: true,
		};

		const aff = new AppFabricationFulfillment();
		aff.setImplementedInterfaces(originalInterfaces);

		// Verify the stored interfaces are equal to the original
		assert.deepStrictEqual(aff.getImplementedInferfaces(), originalInterfaces);

		// Verify that modifying the original object doesn't affect the stored copy
		originalInterfaces[AppInterface.IPreMessageSentPrevent] = false;
		originalInterfaces[AppInterface.IPostMessageSent] = true;
		originalInterfaces[AppInterface.IPreMessageSentModify] = true;

		assert.notStrictEqual(aff.getImplementedInferfaces()[AppInterface.IPreMessageSentPrevent], false);
		assert.notStrictEqual(aff.getImplementedInferfaces()[AppInterface.IPostMessageSent], true);
		assert.ok(aff.getImplementedInferfaces()[AppInterface.IPreMessageSentModify] === undefined);

		// Verify the stored copy still has original values
		assert.strictEqual(aff.getImplementedInferfaces()[AppInterface.IPreMessageSentPrevent], true);
		assert.strictEqual(aff.getImplementedInferfaces()[AppInterface.IPostMessageSent], false);
		assert.strictEqual(aff.getImplementedInferfaces()[AppInterface.IPreMessageSentExtend], true);
	});

	it('setImplementedInterfacesHandlesEmptyObject', () => {
		const emptyInterfaces: { [int: string]: boolean } = {};

		const aff = new AppFabricationFulfillment();
		assert.doesNotThrow(() => aff.setImplementedInterfaces(emptyInterfaces));
		assert.strictEqual(Object.keys(aff.getImplementedInferfaces()).length, 0);
		assert.notStrictEqual(aff.getImplementedInferfaces(), emptyInterfaces);
	});
});
