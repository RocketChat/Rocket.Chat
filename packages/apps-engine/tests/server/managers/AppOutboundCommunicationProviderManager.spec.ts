import type { RestorableFunctionSpy } from 'alsatian';
import { AsyncTest, Expect, Setup, SetupFixture, SpyOn, Teardown, Test } from 'alsatian';

import type { AppManager } from '../../../src/server/AppManager';
import type { ProxiedApp } from '../../../src/server/ProxiedApp';
import type { AppBridges } from '../../../src/server/bridges';
import type { AppApiManager, AppExternalComponentManager, AppSchedulerManager, AppSlashCommandManager } from '../../../src/server/managers';
import { AppAccessorManager, AppOutboundCommunicationProviderManager } from '../../../src/server/managers';
import { OutboundMessageProvider } from '../../../src/server/managers/AppOutboundCommunicationProvider';
import { AppPermissionManager } from '../../../src/server/managers/AppPermissionManager';
import type { UIActionButtonManager } from '../../../src/server/managers/UIActionButtonManager';
import type { AppLogStorage } from '../../../src/server/storage';
import { TestsAppBridges } from '../../test-data/bridges/appBridges';
import { TestsAppLogStorage } from '../../test-data/storage/logStorage';
import { TestData } from '../../test-data/utilities';

export class AppOutboundCommunicationProviderManagerTestFixture {
	public static doThrow = false;

	private mockBridges: TestsAppBridges;

	private mockApp: ProxiedApp;

	private mockAccessors: AppAccessorManager;

	private mockManager: AppManager;

	private hasPermissionSpy: RestorableFunctionSpy;

	@SetupFixture
	public setupFixture() {
		this.mockBridges = new TestsAppBridges();

		this.mockApp = TestData.getMockApp({ id: 'testing', name: 'testing' }, this.mockManager);

		const bri = this.mockBridges;
		const app = this.mockApp;

		this.mockManager = {
			getBridges(): AppBridges {
				return bri;
			},
			getCommandManager() {
				return {} as AppSlashCommandManager;
			},
			getExternalComponentManager(): AppExternalComponentManager {
				return {} as AppExternalComponentManager;
			},
			getApiManager() {
				return {} as AppApiManager;
			},
			getOneById(appId: string): ProxiedApp {
				return appId === 'failMePlease' ? undefined : app;
			},
			getLogStorage(): AppLogStorage {
				return new TestsAppLogStorage();
			},
			getSchedulerManager() {
				return {} as AppSchedulerManager;
			},
			getUIActionButtonManager() {
				return {} as UIActionButtonManager;
			},
			getOutboundCommunicationProviderManager() {
				return {} as AppOutboundCommunicationProviderManager;
			},
		} as AppManager;

		this.mockAccessors = new AppAccessorManager(this.mockManager);
		const ac = this.mockAccessors;
		this.mockManager.getAccessorManager = function _getAccessorManager(): AppAccessorManager {
			return ac;
		};
	}

	@Setup
	public setup() {
		this.hasPermissionSpy = SpyOn(AppPermissionManager, 'hasPermission');
		this.hasPermissionSpy.andReturn(true);
	}

	@Teardown
	public teardown() {
		this.hasPermissionSpy.restore();
	}

	@Test()
	public basicAppOutboundCommunicationProviderManager() {
		Expect(() => new AppOutboundCommunicationProviderManager({} as AppManager)).toThrow();
		Expect(() => new AppOutboundCommunicationProviderManager(this.mockManager)).not.toThrow();

		const manager = new AppOutboundCommunicationProviderManager(this.mockManager);
		Expect((manager as any).manager).toBe(this.mockManager);
		Expect((manager as any).accessors).toBe(this.mockManager.getAccessorManager());
		Expect((manager as any).outboundMessageProviders).toBeDefined();
		Expect((manager as any).outboundMessageProviders.size).toBe(0);
	}

	@Test()
	public addProvider() {
		const provider = TestData.getOutboundPhoneMessageProvider();
		const manager = new AppOutboundCommunicationProviderManager(this.mockManager);

		Expect(() => manager.addProvider('testing', provider)).not.toThrow();
		Expect((manager as any).outboundMessageProviders.size).toBe(1);
		Expect(() => manager.addProvider('failMePlease', provider)).toThrowError(
			Error,
			'App must exist in order for an outbound provider to be added.',
		);
		Expect((manager as any).outboundMessageProviders.size).toBe(1);
	}

	@Test()
	public isAlreadyDefined() {
		const provider = TestData.getOutboundPhoneMessageProvider();
		const manager = new AppOutboundCommunicationProviderManager(this.mockManager);

		Expect(manager.isAlreadyDefined('testing', 'phone')).toBe(false);

		manager.addProvider('testing', provider);

		Expect(manager.isAlreadyDefined('testing', 'phone')).toBe(true);
		Expect(manager.isAlreadyDefined('testing', 'email')).toBe(false);
		Expect(manager.isAlreadyDefined('another-app', 'phone')).toBe(false);
	}

	@Test()
	public addProviderTwiceShouldOverwrite() {
		const provider1 = TestData.getOutboundPhoneMessageProvider('provider1');
		const provider2 = TestData.getOutboundPhoneMessageProvider('provider2');
		const manager = new AppOutboundCommunicationProviderManager(this.mockManager);

		manager.addProvider('testing', provider1);
		const firstProviderInfo = (manager as any).outboundMessageProviders.get('testing').get('phone');
		Expect(firstProviderInfo.provider.name).toBe('provider1');

		// Adding a provider of the same type should overwrite the previous one
		manager.addProvider('testing', provider2);
		const secondProviderInfo = (manager as any).outboundMessageProviders.get('testing').get('phone');
		Expect(secondProviderInfo.provider.name).toBe('provider2');
		Expect((manager as any).outboundMessageProviders.get('testing').size).toBe(1);
	}

	@Test()
	public addProviderWithoutPermission() {
		const provider = TestData.getOutboundPhoneMessageProvider();
		const manager = new AppOutboundCommunicationProviderManager(this.mockManager);

		this.hasPermissionSpy.andReturn(false);

		Expect(() => manager.addProvider('testing', provider)).toThrow();
	}

	@Test()
	public ignoreAppsWithoutProviders() {
		const manager = new AppOutboundCommunicationProviderManager(this.mockManager);

		Expect(() => manager.registerProviders('non-existant')).not.toThrow();
	}

	@AsyncTest()
	public async registerProviders() {
		const manager = new AppOutboundCommunicationProviderManager(this.mockManager);

		manager.addProvider('firstApp', TestData.getOutboundPhoneMessageProvider());
		const appInfo = (manager as any).outboundMessageProviders.get('firstApp');
		Expect(appInfo).toBeDefined();
		const regInfo = appInfo.get('phone');
		Expect(regInfo).toBeDefined();

		Expect(regInfo.isRegistered).toBe(false);
		await Expect(async () => manager.registerProviders('firstApp')).not.toThrowAsync();
		Expect(regInfo.isRegistered).toBe(true);
	}

	@AsyncTest()
	public async registerTwoProviders() {
		const manager = new AppOutboundCommunicationProviderManager(this.mockManager);

		manager.addProvider('firstApp', TestData.getOutboundPhoneMessageProvider());
		manager.addProvider('firstApp', TestData.getOutboundEmailMessageProvider());
		const firstApp = (manager as any).outboundMessageProviders.get('firstApp');
		Expect(firstApp).toBeDefined();
		const firstRegInfo = firstApp.get('phone');
		Expect(firstRegInfo).toBeDefined();
		const secondRegInfo = firstApp.get('email');
		Expect(secondRegInfo).toBeDefined();

		Expect(firstRegInfo.isRegistered).toBe(false);
		Expect(secondRegInfo.isRegistered).toBe(false);
		await Expect(async () => manager.registerProviders('firstApp')).not.toThrowAsync();
		Expect(firstRegInfo.isRegistered).toBe(true);
		Expect(secondRegInfo.isRegistered).toBe(true);
	}

	@AsyncTest()
	public async registerProvidersFromMultipleApps() {
		const manager = new AppOutboundCommunicationProviderManager(this.mockManager);

		manager.addProvider('firstApp', TestData.getOutboundPhoneMessageProvider());
		manager.addProvider('firstApp', TestData.getOutboundEmailMessageProvider());
		manager.addProvider('secondApp', TestData.getOutboundPhoneMessageProvider('another-phone-provider'));

		const firstApp = (manager as any).outboundMessageProviders.get('firstApp');
		Expect(firstApp).toBeDefined();
		const firstRegInfo = firstApp.get('phone');
		const secondRegInfo = firstApp.get('email');
		Expect(firstRegInfo).toBeDefined();
		Expect(secondRegInfo).toBeDefined();
		const secondApp = (manager as any).outboundMessageProviders.get('secondApp');
		Expect(secondApp).toBeDefined();
		const thirdRegInfo = secondApp.get('phone');
		Expect(thirdRegInfo).toBeDefined();

		Expect(firstRegInfo.isRegistered).toBe(false);
		Expect(secondRegInfo.isRegistered).toBe(false);
		await Expect(async () => manager.registerProviders('firstApp')).not.toThrowAsync();
		Expect(firstRegInfo.isRegistered).toBe(true);
		Expect(secondRegInfo.isRegistered).toBe(true);
		Expect(thirdRegInfo.isRegistered).toBe(false);
		await Expect(async () => manager.registerProviders('secondApp')).not.toThrowAsync();
		Expect(thirdRegInfo.isRegistered).toBe(true);
	}

	@AsyncTest()
	public async unregisterProviders() {
		const manager = new AppOutboundCommunicationProviderManager(this.mockManager);

		manager.addProvider('testing', TestData.getOutboundPhoneMessageProvider());
		const regInfo = (manager as any).outboundMessageProviders.get('testing').get('phone');
		await Expect(async () => manager.registerProviders('testing')).not.toThrowAsync();

		await Expect(async () => manager.unregisterProviders('non-existant')).not.toThrowAsync();
		Expect(regInfo.isRegistered).toBe(true);
		await Expect(async () => manager.unregisterProviders('testing')).not.toThrowAsync();
		Expect(regInfo.isRegistered).toBe(false);
		// It should be removed from the map
		Expect((manager as any).outboundMessageProviders.has('testing')).toBe(false);
	}

	@AsyncTest()
	public async unregisterProvidersWithKeepReferences() {
		const manager = new AppOutboundCommunicationProviderManager(this.mockManager);

		manager.addProvider('testing', TestData.getOutboundPhoneMessageProvider());
		const appInfo = (manager as any).outboundMessageProviders.get('testing');
		const regInfo = appInfo.get('phone');

		await Expect(async () => manager.registerProviders('testing')).not.toThrowAsync();
		Expect(regInfo.isRegistered).toBe(true);
		await Expect(async () => manager.unregisterProviders('testing', { keepReferences: true })).not.toThrowAsync();
		Expect(regInfo.isRegistered).toBe(false);
		// It should not be removed from the map
		Expect((manager as any).outboundMessageProviders.has('testing')).toBe(true);
	}

	@Test()
	public failToGetMetadataWithoutProvider() {
		const manager = new AppOutboundCommunicationProviderManager(this.mockManager);

		Expect(() => manager.getProviderMetadata('testing', 'phone')).toThrowError(Error, 'provider-not-registered');

		manager.addProvider('testing', TestData.getOutboundPhoneMessageProvider());

		Expect(() => manager.getProviderMetadata('testing', 'email')).toThrowError(Error, 'provider-not-registered');
	}

	@Test()
	public getProviderMetadata() {
		const manager = new AppOutboundCommunicationProviderManager(this.mockManager);
		manager.addProvider('testing', TestData.getOutboundPhoneMessageProvider());

		SpyOn(OutboundMessageProvider.prototype, 'runGetProviderMetadata').andReturn({
			name: 'test-provider',
			capabilities: ['sms'],
		});

		const metadata = manager.getProviderMetadata('testing', 'phone');
		Expect(metadata).toEqual({
			name: 'test-provider',
			capabilities: ['sms'],
		});
	}

	@Test()
	public failToSendOutboundMessageWithoutProvider() {
		const manager = new AppOutboundCommunicationProviderManager(this.mockManager);
		const message = TestData.getOutboundMessage();

		Expect(() => manager.sendOutboundMessage('testing', 'phone', message)).toThrowError(Error, 'provider-not-registered');

		manager.addProvider('testing', TestData.getOutboundPhoneMessageProvider());

		Expect(() => manager.sendOutboundMessage('testing', 'email', message)).toThrowError(Error, 'provider-not-registered');
	}

	@Test()
	public sendOutboundMessage() {
		const manager = new AppOutboundCommunicationProviderManager(this.mockManager);
		manager.addProvider('testing', TestData.getOutboundPhoneMessageProvider());

		const message = TestData.getOutboundMessage();

		SpyOn(OutboundMessageProvider.prototype, 'runSendOutboundMessage').andReturn(Promise.resolve('message-id'));

		const result = manager.sendOutboundMessage('testing', 'phone', message);
		Expect(result).toBeDefined();
	}
}
