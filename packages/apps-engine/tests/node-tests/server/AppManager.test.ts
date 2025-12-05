import * as assert from 'node:assert';
import { describe, it, afterEach, mock } from 'node:test';

import { AppManager } from '../../../src/server/AppManager';
import { AppBridges } from '../../../src/server/bridges';
import { AppCompiler, AppPackageParser } from '../../../src/server/compiler';
import {
	AppAccessorManager,
	AppApiManager,
	AppExternalComponentManager,
	AppListenerManager,
	AppSettingsManager,
	AppSlashCommandManager,
	AppVideoConfProviderManager,
	AppOutboundCommunicationProviderManager,
} from '../../../src/server/managers';
import type { AppLogStorage, AppMetadataStorage, AppSourceStorage } from '../../../src/server/storage';
import { SimpleClass, TestData, TestInfastructureSetup } from '../../test-data/utilities';

describe('AppManager', () => {
	const testingInfastructure = new TestInfastructureSetup();

	afterEach(() => {
		AppManager.Instance = undefined;
	});

	it('Setup of the AppManager', () => {
		const manager = new AppManager({
			metadataStorage: testingInfastructure.getAppStorage(),
			logStorage: testingInfastructure.getLogStorage(),
			bridges: testingInfastructure.getAppBridges(),
			sourceStorage: testingInfastructure.getSourceStorage(),
		});

		assert.strictEqual(manager.getStorage(), testingInfastructure.getAppStorage());
		assert.strictEqual(manager.getLogStorage(), testingInfastructure.getLogStorage());
		// NOTE: manager.getBridges() returns a proxy, so they are vlaue equality instead of reference equality
		assert.deepStrictEqual(manager.getBridges(), testingInfastructure.getAppBridges());
		assert.strictEqual(manager.areAppsLoaded(), false);

		assert.throws(
			() =>
				new AppManager({
					metadataStorage: {} as AppMetadataStorage,
					logStorage: {} as AppLogStorage,
					bridges: {} as AppBridges,
					sourceStorage: {} as AppSourceStorage,
				}),
			{
				name: 'Error',
				message: 'There is already a valid AppManager instance',
			},
		);
	});

	it('Invalid Storage and Bridge', () => {
		const invalid = new SimpleClass();

		assert.throws(
			() =>
				new AppManager({
					metadataStorage: invalid as any,
					logStorage: invalid as any,
					bridges: invalid as any,
					sourceStorage: invalid as any,
				}),
			{
				name: 'Error',
				message: 'Invalid instance of the AppMetadataStorage',
			},
		);

		assert.throws(
			() =>
				new AppManager({
					metadataStorage: testingInfastructure.getAppStorage(),
					logStorage: invalid as any,
					bridges: invalid as any,
					sourceStorage: invalid as any,
				}),
			{
				name: 'Error',
				message: 'Invalid instance of the AppLogStorage',
			},
		);

		assert.throws(
			() =>
				new AppManager({
					metadataStorage: testingInfastructure.getAppStorage(),
					logStorage: testingInfastructure.getLogStorage(),
					bridges: invalid as any,
					sourceStorage: invalid as any,
				}),
			{
				name: 'Error',
				message: 'Invalid instance of the AppBridges',
			},
		);

		assert.throws(
			() =>
				new AppManager({
					metadataStorage: testingInfastructure.getAppStorage(),
					logStorage: testingInfastructure.getLogStorage(),
					bridges: testingInfastructure.getAppBridges(),
					sourceStorage: invalid as any,
				}),
			{
				name: 'Error',
				message: 'Invalid instance of the AppSourceStorage',
			},
		);
	});

	it('Ensure Managers are Valid Types', () => {
		const manager = new AppManager({
			metadataStorage: testingInfastructure.getAppStorage(),
			logStorage: testingInfastructure.getLogStorage(),
			bridges: testingInfastructure.getAppBridges(),
			sourceStorage: testingInfastructure.getSourceStorage(),
		});

		assert.ok(manager.getParser() instanceof AppPackageParser);
		assert.ok(manager.getCompiler() instanceof AppCompiler);
		assert.ok(manager.getAccessorManager() instanceof AppAccessorManager);
		assert.ok(manager.getBridges() instanceof AppBridges);
		assert.ok(manager.getListenerManager() instanceof AppListenerManager);
		assert.ok(manager.getCommandManager() instanceof AppSlashCommandManager);
		assert.ok(manager.getExternalComponentManager() instanceof AppExternalComponentManager);
		assert.ok(manager.getApiManager() instanceof AppApiManager);
		assert.ok(manager.getSettingsManager() instanceof AppSettingsManager);
		assert.ok(manager.getVideoConfProviderManager() instanceof AppVideoConfProviderManager);
		assert.ok(manager.getOutboundCommunicationProviderManager() instanceof AppOutboundCommunicationProviderManager);
	});

	it('Update Apps Marketplace Info - Apps without subscription info are skipped', async () => {
		const manager = new AppManager({
			metadataStorage: testingInfastructure.getAppStorage(),
			logStorage: testingInfastructure.getLogStorage(),
			bridges: testingInfastructure.getAppBridges(),
			sourceStorage: testingInfastructure.getSourceStorage(),
		});

		const appsOverview = TestData.getAppsOverview();
		appsOverview[0].latest.subscriptionInfo = undefined; // No subscription info

		// Mock the apps Map to return our mock app
		(manager as any).apps = new Map([['test-app', TestData.getMockApp(TestData.getAppStorageItem(), manager)]]);

		const updatePartialAndReturnDocumentSpy = mock.method(manager.getStorage(), 'updatePartialAndReturnDocument', () => Promise.resolve());

		// Should not throw and complete successfully
		await manager.updateAppsMarketplaceInfo(appsOverview);

		assert.strictEqual(updatePartialAndReturnDocumentSpy.mock.calls.length, 0);
	});

	it('Update Apps Marketplace Info - Apps not found in manager are skipped', async () => {
		const manager = new AppManager({
			metadataStorage: testingInfastructure.getAppStorage(),
			logStorage: testingInfastructure.getLogStorage(),
			bridges: testingInfastructure.getAppBridges(),
			sourceStorage: testingInfastructure.getSourceStorage(),
		});

		const appsOverview = TestData.getAppsOverview();
		appsOverview[0].latest.id = 'nonexistent-app'; // App not in manager

		// Mock the apps Map to return our mock app
		(manager as any).apps = new Map([['test-app', TestData.getMockApp(TestData.getAppStorageItem(), manager)]]);

		const updatePartialAndReturnDocumentSpy = mock.method(manager.getStorage(), 'updatePartialAndReturnDocument', () => Promise.resolve());

		// Should not throw and complete successfully
		await manager.updateAppsMarketplaceInfo(appsOverview);

		assert.strictEqual(updatePartialAndReturnDocumentSpy.mock.calls.length, 0);
	});

	it('Update Apps Marketplace Info - Apps with same license are skipped', async () => {
		const manager = new AppManager({
			metadataStorage: testingInfastructure.getAppStorage(),
			logStorage: testingInfastructure.getLogStorage(),
			bridges: testingInfastructure.getAppBridges(),
			sourceStorage: testingInfastructure.getSourceStorage(),
		});

		const sameLicenseData = 'same-license-data';
		const existingSubscriptionInfo = TestData.getMarketplaceSubscriptionInfo({
			license: { license: sameLicenseData, version: 1, expireDate: new Date('2023-01-01') },
		});

		const mockStorageItem = TestData.getAppStorageItem({
			marketplaceInfo: [TestData.getMarketplaceInfo({ subscriptionInfo: existingSubscriptionInfo })],
		});

		const mockApp = TestData.getMockApp(mockStorageItem, manager);

		// Mock the apps Map to return our mock app
		(manager as any).apps = new Map([['test-app', mockApp]]);

		const appsOverview = TestData.getAppsOverview(
			TestData.getMarketplaceSubscriptionInfo({
				license: { license: sameLicenseData, version: 1, expireDate: new Date('2023-01-01') },
			}),
		);

		const updatePartialAndReturnDocumentSpy = mock.method(manager.getStorage(), 'updatePartialAndReturnDocument', () => Promise.resolve());

		// Should not throw and complete successfully
		await manager.updateAppsMarketplaceInfo(appsOverview);

		// Verify the subscription info was not updated (should remain the same)
		assert.strictEqual(mockStorageItem.marketplaceInfo[0].subscriptionInfo.seats, 10); // Original value
		assert.strictEqual(updatePartialAndReturnDocumentSpy.mock.calls.length, 0);
	});

	it('Update Apps Marketplace Info - Subscription info is updated and app is signed', async () => {
		const manager = new AppManager({
			metadataStorage: testingInfastructure.getAppStorage(),
			logStorage: testingInfastructure.getLogStorage(),
			bridges: testingInfastructure.getAppBridges(),
			sourceStorage: testingInfastructure.getSourceStorage(),
		});

		const existingSubscriptionInfo = TestData.getMarketplaceSubscriptionInfo({
			license: { license: 'old-license-data', version: 1, expireDate: new Date('2023-01-01') },
		});

		const newSubscriptionInfo = TestData.getMarketplaceSubscriptionInfo({
			seats: 20,
			maxSeats: 200,
			startDate: '2023-02-01',
			periodEnd: '2024-01-31',
			license: { license: 'new-license-data', version: 1, expireDate: new Date('2026-01-01') },
		});

		const mockStorageItem = TestData.getAppStorageItem({
			marketplaceInfo: [TestData.getMarketplaceInfo({ subscriptionInfo: existingSubscriptionInfo })],
		});

		const mockApp = TestData.getMockApp(mockStorageItem, manager);

		mock.method(manager.getSignatureManager(), 'signApp', () => Promise.resolve('signed-app-data'));
		mock.method(mockApp, 'validateLicense', () => Promise.resolve());

		const updatePartialAndReturnDocumentSpy = mock.method(manager.getStorage(), 'updatePartialAndReturnDocument', () =>
			Promise.resolve(mockStorageItem),
		);

		// Mock the apps Map and dependencies
		(manager as any).apps = new Map([['test-app', mockApp]]);

		const appsOverview = TestData.getAppsOverview(newSubscriptionInfo);

		await manager.updateAppsMarketplaceInfo(appsOverview);

		const expectedStorageItem = mockApp.getStorageItem();

		// Verify the subscription info was updated
		assert.strictEqual(expectedStorageItem.marketplaceInfo[0].subscriptionInfo.seats, 20);
		assert.strictEqual(expectedStorageItem.marketplaceInfo[0].subscriptionInfo.license.license, 'new-license-data');
		assert.strictEqual(expectedStorageItem.signature, 'signed-app-data');
		assert.strictEqual(updatePartialAndReturnDocumentSpy.mock.calls.length, 1);
	});
});
