import { Expect, Test } from 'alsatian';

import { AppStatus } from '../../../src/definition/AppStatus';
import type { IAppInfo } from '../../../src/definition/metadata';
import { AppInterface } from '../../../src/definition/metadata';
import type { AppManager } from '../../../src/server/AppManager';
import { ProxiedApp } from '../../../src/server/ProxiedApp';
import { AppFabricationFulfillment } from '../../../src/server/compiler';
import { AppPermissions } from '../../../src/server/permissions/AppPermissions';
import type { IAppStorageItem } from '../../../src/server/storage';
import { TestData } from '../../test-data/utilities';

export class AppFabricationFulfillmentTestFixture {
	@Test()
	public appFabricationDefinement() {
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

		Expect(() => new AppFabricationFulfillment()).not.toThrow();

		const aff = new AppFabricationFulfillment();
		Expect(() => aff.setAppInfo(expctedInfo)).not.toThrow();
		Expect(aff.getAppInfo()).toEqual(expctedInfo);

		const expectedInter: { [key: string]: boolean } = {};
		expectedInter[AppInterface.IPreMessageSentPrevent] = true;
		Expect(() => aff.setImplementedInterfaces(expectedInter)).not.toThrow();
		Expect(aff.getImplementedInferfaces()).toEqual(expectedInter);

		const fakeApp = new ProxiedApp(
			{} as AppManager,
			{ status: AppStatus.UNKNOWN } as IAppStorageItem,
			TestData.getMockRuntimeController('unknown'),
		);

		Expect(() => aff.setApp(fakeApp)).not.toThrow();
		Expect(aff.getApp()).toEqual(fakeApp);
	}

	@Test()
	public setAppInfoCreatesDeepClone() {
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
		Expect(aff.getAppInfo()).toEqual(originalInfo);

		// Verify that modifying the original object doesn't affect the stored copy
		originalInfo.name = 'Modified Name';
		originalInfo.author.name = 'Modified Author';
		originalInfo.implements.push(AppInterface.IPostMessageSent);
		originalInfo.permissions.push(AppPermissions.message.write);

		Expect(aff.getAppInfo().name).not.toEqual('Modified Name');
		Expect(aff.getAppInfo().author.name).not.toEqual('Modified Author');
		Expect(aff.getAppInfo().implements).not.toContain(AppInterface.IPostMessageSent);
		Expect(aff.getAppInfo().permissions).not.toContain(AppPermissions.message.write);

		// Verify the stored copy still has original values
		Expect(aff.getAppInfo().name).toEqual('Test App');
		Expect(aff.getAppInfo().author.name).toEqual('Test Author');
		Expect(aff.getAppInfo().implements).toEqual([AppInterface.IPreMessageSentPrevent]);
		Expect(aff.getAppInfo().permissions).toEqual([AppPermissions.user.read, AppPermissions.user.write]);
	}

	@Test()
	public setImplementedInterfacesCreatesDeepClone() {
		const originalInterfaces: { [int: string]: boolean } = {
			[AppInterface.IPreMessageSentPrevent]: true,
			[AppInterface.IPostMessageSent]: false,
			[AppInterface.IPreMessageSentExtend]: true,
		};

		const aff = new AppFabricationFulfillment();
		aff.setImplementedInterfaces(originalInterfaces);

		// Verify the stored interfaces are equal to the original
		Expect(aff.getImplementedInferfaces()).toEqual(originalInterfaces);

		// Verify that modifying the original object doesn't affect the stored copy
		originalInterfaces[AppInterface.IPreMessageSentPrevent] = false;
		originalInterfaces[AppInterface.IPostMessageSent] = true;
		originalInterfaces[AppInterface.IPreMessageSentModify] = true;

		Expect(aff.getImplementedInferfaces()[AppInterface.IPreMessageSentPrevent]).not.toEqual(false);
		Expect(aff.getImplementedInferfaces()[AppInterface.IPostMessageSent]).not.toEqual(true);
		Expect(aff.getImplementedInferfaces()[AppInterface.IPreMessageSentModify]).not.toBeDefined();

		// Verify the stored copy still has original values
		Expect(aff.getImplementedInferfaces()[AppInterface.IPreMessageSentPrevent]).toEqual(true);
		Expect(aff.getImplementedInferfaces()[AppInterface.IPostMessageSent]).toEqual(false);
		Expect(aff.getImplementedInferfaces()[AppInterface.IPreMessageSentExtend]).toEqual(true);
	}

	@Test()
	public setImplementedInterfacesHandlesEmptyObject() {
		const emptyInterfaces: { [int: string]: boolean } = {};

		const aff = new AppFabricationFulfillment();
		Expect(() => aff.setImplementedInterfaces(emptyInterfaces)).not.toThrow();
		Expect(Object.keys(aff.getImplementedInferfaces()).length).toEqual(0);
		Expect(aff.getImplementedInferfaces()).not.toBe(emptyInterfaces);
	}
}
