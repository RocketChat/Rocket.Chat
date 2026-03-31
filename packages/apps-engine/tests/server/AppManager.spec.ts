import { AsyncTest, Expect, SetupFixture, SpyOn, Teardown, Test } from 'alsatian';

import { AppManager } from '../../src/server/AppManager';
import { AppBridges } from '../../src/server/bridges';
import { AppCompiler, AppPackageParser } from '../../src/server/compiler';
import {
	AppAccessorManager,
	AppApiManager,
	AppExternalComponentManager,
	AppListenerManager,
	AppSettingsManager,
	AppSlashCommandManager,
	AppVideoConfProviderManager,
	AppOutboundCommunicationProviderManager,
} from '../../src/server/managers';
import type { AppLogStorage, AppMetadataStorage, AppSourceStorage } from '../../src/server/storage';
import { SimpleClass, TestData, TestInfastructureSetup } from '../test-data/utilities';

export class AppManagerTestFixture {
	private testingInfastructure: TestInfastructureSetup;

	@SetupFixture
	public setupFixture() {
		this.testingInfastructure = new TestInfastructureSetup();
	}

	@Teardown
	public teardown() {
		AppManager.Instance = undefined;
	}

	@Test('Setup of the AppManager')
	public setupAppManager() {
		const manager = new AppManager({
			metadataStorage: this.testingInfastructure.getAppStorage(),
			logStorage: this.testingInfastructure.getLogStorage(),
			bridges: this.testingInfastructure.getAppBridges(),
			sourceStorage: this.testingInfastructure.getSourceStorage(),
		});

		Expect(manager.getStorage()).toBe(this.testingInfastructure.getAppStorage());
		Expect(manager.getLogStorage()).toBe(this.testingInfastructure.getLogStorage());
		// NOTE: manager.getBridges() returns a proxy, so they are vlaue equality instead of reference equality
		Expect(manager.getBridges()).toEqual(this.testingInfastructure.getAppBridges());
		Expect(manager.areAppsLoaded()).toBe(false);

		Expect(
			() =>
				new AppManager({
					metadataStorage: {} as AppMetadataStorage,
					logStorage: {} as AppLogStorage,
					bridges: {} as AppBridges,
					sourceStorage: {} as AppSourceStorage,
				}),
		).toThrowError(Error, 'There is already a valid AppManager instance');
	}

	@Test('Invalid Storage and Bridge')
	public invalidInstancesPassed() {
		const invalid = new SimpleClass();

		Expect(
			() =>
				new AppManager({
					metadataStorage: invalid as any,
					logStorage: invalid as any,
					bridges: invalid as any,
					sourceStorage: invalid as any,
				}),
		).toThrowError(Error, 'Invalid instance of the AppMetadataStorage');

		Expect(
			() =>
				new AppManager({
					metadataStorage: this.testingInfastructure.getAppStorage(),
					logStorage: invalid as any,
					bridges: invalid as any,
					sourceStorage: invalid as any,
				}),
		).toThrowError(Error, 'Invalid instance of the AppLogStorage');

		Expect(
			() =>
				new AppManager({
					metadataStorage: this.testingInfastructure.getAppStorage(),
					logStorage: this.testingInfastructure.getLogStorage(),
					bridges: invalid as any,
					sourceStorage: invalid as any,
				}),
		).toThrowError(Error, 'Invalid instance of the AppBridges');

		Expect(
			() =>
				new AppManager({
					metadataStorage: this.testingInfastructure.getAppStorage(),
					logStorage: this.testingInfastructure.getLogStorage(),
					bridges: this.testingInfastructure.getAppBridges(),
					sourceStorage: invalid as any,
				}),
		).toThrowError(Error, 'Invalid instance of the AppSourceStorage');
	}

	@Test('Ensure Managers are Valid Types')
	public verifyManagers() {
		const manager = new AppManager({
			metadataStorage: this.testingInfastructure.getAppStorage(),
			logStorage: this.testingInfastructure.getLogStorage(),
			bridges: this.testingInfastructure.getAppBridges(),
			sourceStorage: this.testingInfastructure.getSourceStorage(),
		});

		Expect(manager.getParser() instanceof AppPackageParser).toBe(true);
		Expect(manager.getCompiler() instanceof AppCompiler).toBe(true);
		Expect(manager.getAccessorManager() instanceof AppAccessorManager).toBe(true);
		Expect(manager.getBridges() instanceof AppBridges).toBe(true);
		Expect(manager.getListenerManager() instanceof AppListenerManager).toBe(true);
		Expect(manager.getCommandManager() instanceof AppSlashCommandManager).toBe(true);
		Expect(manager.getExternalComponentManager() instanceof AppExternalComponentManager).toBe(true);
		Expect(manager.getApiManager() instanceof AppApiManager).toBe(true);
		Expect(manager.getSettingsManager() instanceof AppSettingsManager).toBe(true);
		Expect(manager.getVideoConfProviderManager() instanceof AppVideoConfProviderManager).toBe(true);
		Expect(manager.getOutboundCommunicationProviderManager() instanceof AppOutboundCommunicationProviderManager).toBe(true);
	}

	@AsyncTest('Update Apps Marketplace Info - Apps without subscription info are skipped')
	public async updateAppsMarketplaceInfoSkipsAppsWithoutSubscriptionInfo() {
		const manager = new AppManager({
			metadataStorage: this.testingInfastructure.getAppStorage(),
			logStorage: this.testingInfastructure.getLogStorage(),
			bridges: this.testingInfastructure.getAppBridges(),
			sourceStorage: this.testingInfastructure.getSourceStorage(),
		});

		const appsOverview = TestData.getAppsOverview();
		appsOverview[0].latest.subscriptionInfo = undefined; // No subscription info

		// Mock the apps Map to return our mock app
		(manager as any).apps = new Map([['test-app', TestData.getMockApp(TestData.getAppStorageItem(), manager)]]);

		const updatePartialAndReturnDocumentSpy = SpyOn(manager.getStorage(), 'updatePartialAndReturnDocument');
		updatePartialAndReturnDocumentSpy.andReturn(Promise.resolve());

		// Should not throw and complete successfully
		await manager.updateAppsMarketplaceInfo(appsOverview);

		Expect(updatePartialAndReturnDocumentSpy).not.toHaveBeenCalled();
	}

	@AsyncTest('Update Apps Marketplace Info - Apps not found in manager are skipped')
	public async updateAppsMarketplaceInfoSkipsAppsNotInManager() {
		const manager = new AppManager({
			metadataStorage: this.testingInfastructure.getAppStorage(),
			logStorage: this.testingInfastructure.getLogStorage(),
			bridges: this.testingInfastructure.getAppBridges(),
			sourceStorage: this.testingInfastructure.getSourceStorage(),
		});

		const appsOverview = TestData.getAppsOverview();
		appsOverview[0].latest.id = 'nonexistent-app'; // App not in manager

		// Mock the apps Map to return our mock app
		(manager as any).apps = new Map([['test-app', TestData.getMockApp(TestData.getAppStorageItem(), manager)]]);

		const updatePartialAndReturnDocumentSpy = SpyOn(manager.getStorage(), 'updatePartialAndReturnDocument');
		updatePartialAndReturnDocumentSpy.andReturn(Promise.resolve());

		// Should not throw and complete successfully
		await manager.updateAppsMarketplaceInfo(appsOverview);

		Expect(updatePartialAndReturnDocumentSpy).not.toHaveBeenCalled();
	}

	@AsyncTest('Update Apps Marketplace Info - Apps with same license are skipped')
	public async updateAppsMarketplaceInfoSkipsAppsWithSameLicense() {
		const manager = new AppManager({
			metadataStorage: this.testingInfastructure.getAppStorage(),
			logStorage: this.testingInfastructure.getLogStorage(),
			bridges: this.testingInfastructure.getAppBridges(),
			sourceStorage: this.testingInfastructure.getSourceStorage(),
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

		const updatePartialAndReturnDocumentSpy = SpyOn(manager.getStorage(), 'updatePartialAndReturnDocument');
		updatePartialAndReturnDocumentSpy.andReturn(Promise.resolve());

		// Should not throw and complete successfully
		await manager.updateAppsMarketplaceInfo(appsOverview);

		// Verify the subscription info was not updated (should remain the same)
		Expect(mockStorageItem.marketplaceInfo[0].subscriptionInfo.seats).toBe(10); // Original value
		Expect(updatePartialAndReturnDocumentSpy).not.toHaveBeenCalled();
	}

	@AsyncTest('Update Apps Marketplace Info - Subscription info is updated and app is signed')
	public async updateAppsMarketplaceInfoUpdatesSubscriptionAndSignsApp() {
		const manager = new AppManager({
			metadataStorage: this.testingInfastructure.getAppStorage(),
			logStorage: this.testingInfastructure.getLogStorage(),
			bridges: this.testingInfastructure.getAppBridges(),
			sourceStorage: this.testingInfastructure.getSourceStorage(),
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

		// eslint-disable-next-line no-return-assign
		SpyOn(manager.getSignatureManager(), 'signApp').andReturn(Promise.resolve('signed-app-data'));
		SpyOn(mockApp, 'validateLicense').andReturn(Promise.resolve());

		const updatePartialAndReturnDocumentSpy = SpyOn(manager.getStorage(), 'updatePartialAndReturnDocument');
		updatePartialAndReturnDocumentSpy.andReturn(Promise.resolve(mockStorageItem));

		// Mock the apps Map and dependencies
		(manager as any).apps = new Map([['test-app', mockApp]]);

		const appsOverview = TestData.getAppsOverview(newSubscriptionInfo);

		await manager.updateAppsMarketplaceInfo(appsOverview);

		const expectedStorageItem = mockApp.getStorageItem();

		// Verify the subscription info was updated
		Expect(expectedStorageItem.marketplaceInfo[0].subscriptionInfo.seats).toBe(20);
		Expect(expectedStorageItem.marketplaceInfo[0].subscriptionInfo.license.license).toBe('new-license-data');
		Expect(expectedStorageItem.signature).toBe('signed-app-data');
		Expect(updatePartialAndReturnDocumentSpy).toHaveBeenCalled().exactly(1).times;
	}
}
