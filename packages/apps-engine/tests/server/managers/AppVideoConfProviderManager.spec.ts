import { AsyncTest, Expect, Setup, SetupFixture, SpyOn, Teardown, Test } from 'alsatian';

import type { AppManager } from '../../../src/server/AppManager';
import type { ProxiedApp } from '../../../src/server/ProxiedApp';
import type { AppBridges } from '../../../src/server/bridges';
import { VideoConfProviderAlreadyExistsError, VideoConfProviderNotRegisteredError } from '../../../src/server/errors';
import type { AppApiManager, AppExternalComponentManager, AppSchedulerManager, AppSlashCommandManager } from '../../../src/server/managers';
import { AppAccessorManager, AppVideoConfProviderManager } from '../../../src/server/managers';
import { AppVideoConfProvider } from '../../../src/server/managers/AppVideoConfProvider';
import type { UIActionButtonManager } from '../../../src/server/managers/UIActionButtonManager';
import type { AppLogStorage } from '../../../src/server/storage';
import { TestsAppBridges } from '../../test-data/bridges/appBridges';
import { TestsAppLogStorage } from '../../test-data/storage/logStorage';
import { TestData } from '../../test-data/utilities';

export class AppVideoConfProviderManagerTestFixture {
    public static doThrow = false;

    private mockBridges: TestsAppBridges;

    private mockApp: ProxiedApp;

    private mockAccessors: AppAccessorManager;

    private mockManager: AppManager;

    @SetupFixture
    public setupFixture() {
        this.mockBridges = new TestsAppBridges();

        this.mockApp = TestData.getMockApp('testing', 'testing');

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
            getVideoConfProviderManager() {
                return {} as AppVideoConfProviderManager;
            },
        } as AppManager;

        this.mockAccessors = new AppAccessorManager(this.mockManager);
        const ac = this.mockAccessors;
        this.mockManager.getAccessorManager = function _getAccessorManager(): AppAccessorManager {
            return ac;
        };
    }

    @Setup
    public setup() {}

    @Teardown
    public teardown() {}

    @Test()
    public basicAppVideoConfProviderManager() {
        Expect(() => new AppVideoConfProviderManager({} as AppManager)).toThrow();
        Expect(() => new AppVideoConfProviderManager(this.mockManager)).not.toThrow();

        const manager = new AppVideoConfProviderManager(this.mockManager);
        Expect((manager as any).manager).toBe(this.mockManager);
        Expect((manager as any).accessors).toBe(this.mockManager.getAccessorManager());
        Expect((manager as any).videoConfProviders).toBeDefined();
        Expect((manager as any).videoConfProviders.size).toBe(0);
    }

    @Test()
    public addProvider() {
        const provider = TestData.getVideoConfProvider();
        const manager = new AppVideoConfProviderManager(this.mockManager);

        Expect(() => manager.addProvider('testing', provider)).not.toThrow();
        Expect((manager as any).videoConfProviders.size).toBe(1);
        Expect(() => manager.addProvider('failMePlease', provider)).toThrowError(Error, 'App must exist in order for a video conference provider to be added.');
        Expect((manager as any).videoConfProviders.size).toBe(1);
    }

    @Test()
    public ignoreAppsWithoutProviders() {
        const manager = new AppVideoConfProviderManager(this.mockManager);

        Expect(() => manager.registerProviders('non-existant')).not.toThrow();
    }

    @Test()
    public registerProviders() {
        const manager = new AppVideoConfProviderManager(this.mockManager);

        manager.addProvider('firstApp', TestData.getVideoConfProvider());
        const appInfo = (manager as any).videoConfProviders.get('firstApp') as Map<string, AppVideoConfProvider>;
        Expect(appInfo).toBeDefined();
        const regInfo = appInfo.get('test');
        Expect(regInfo).toBeDefined();

        Expect(regInfo.isRegistered).toBe(false);
        Expect(() => manager.registerProviders('firstApp')).not.toThrow();
        Expect(regInfo.isRegistered).toBe(true);
    }

    @Test()
    public registerTwoProviders() {
        const manager = new AppVideoConfProviderManager(this.mockManager);

        manager.addProvider('firstApp', TestData.getVideoConfProvider());
        manager.addProvider('firstApp', TestData.getVideoConfProvider('another-test'));
        const firstApp = (manager as any).videoConfProviders.get('firstApp') as Map<string, AppVideoConfProvider>;
        Expect(firstApp).toBeDefined();
        const firstRegInfo = firstApp.get('test');
        Expect(firstRegInfo).toBeDefined();
        const secondRegInfo = firstApp.get('another-test');
        Expect(secondRegInfo).toBeDefined();

        Expect(firstRegInfo.isRegistered).toBe(false);
        Expect(secondRegInfo.isRegistered).toBe(false);
        Expect(() => manager.registerProviders('firstApp')).not.toThrow();
        Expect(firstRegInfo.isRegistered).toBe(true);
        Expect(secondRegInfo.isRegistered).toBe(true);
    }

    @Test()
    public registerProvidersFromMultipleApps() {
        const manager = new AppVideoConfProviderManager(this.mockManager);

        manager.addProvider('firstApp', TestData.getVideoConfProvider());
        manager.addProvider('firstApp', TestData.getVideoConfProvider('another-test'));
        manager.addProvider('secondApp', TestData.getVideoConfProvider('test3'));

        const firstApp = (manager as any).videoConfProviders.get('firstApp') as Map<string, AppVideoConfProvider>;
        Expect(firstApp).toBeDefined();
        const firstRegInfo = firstApp.get('test');
        const secondRegInfo = firstApp.get('another-test');
        Expect(firstRegInfo).toBeDefined();
        Expect(secondRegInfo).toBeDefined();
        const secondApp = (manager as any).videoConfProviders.get('secondApp') as Map<string, AppVideoConfProvider>;
        Expect(secondApp).toBeDefined();
        const thirdRegInfo = secondApp.get('test3');
        Expect(thirdRegInfo).toBeDefined();

        Expect(firstRegInfo.isRegistered).toBe(false);
        Expect(secondRegInfo.isRegistered).toBe(false);
        Expect(() => manager.registerProviders('firstApp')).not.toThrow();
        Expect(firstRegInfo.isRegistered).toBe(true);
        Expect(secondRegInfo.isRegistered).toBe(true);
        Expect(thirdRegInfo.isRegistered).toBe(false);
        Expect(() => manager.registerProviders('secondApp')).not.toThrow();
        Expect(thirdRegInfo.isRegistered).toBe(true);
    }

    @Test()
    public failToRegisterSameProvider() {
        const manager = new AppVideoConfProviderManager(this.mockManager);

        manager.addProvider('firstApp', TestData.getVideoConfProvider());

        Expect(() => manager.addProvider('secondApp', TestData.getVideoConfProvider('test'))).toThrowError(
            VideoConfProviderAlreadyExistsError,
            `The video conference provider "test" was already registered by another App.`,
        );
    }

    @Test()
    public unregisterProviders() {
        const manager = new AppVideoConfProviderManager(this.mockManager);

        manager.addProvider('testing', TestData.getVideoConfProvider());
        const regInfo = (manager as any).videoConfProviders.get('testing').get('test') as AppVideoConfProvider;
        Expect(() => manager.registerProviders('testing')).not.toThrow();

        Expect(() => manager.unregisterProviders('non-existant')).not.toThrow();
        Expect(regInfo.isRegistered).toBe(true);
        Expect(() => manager.unregisterProviders('testing')).not.toThrow();
        Expect(regInfo.isRegistered).toBe(false);
    }

    @AsyncTest()
    public async failToGenerateUrlWithoutProvider() {
        const manager = new AppVideoConfProviderManager(this.mockManager);

        const call = TestData.getVideoConfData();

        await Expect(async () => manager.generateUrl('test', call)).toThrowErrorAsync(
            VideoConfProviderNotRegisteredError,
            `The video conference provider "test" is not registered in the system.`,
        );

        manager.addProvider('testing', TestData.getVideoConfProvider());

        await Expect(() => manager.generateUrl('test', call)).toThrowErrorAsync(
            VideoConfProviderNotRegisteredError,
            `The video conference provider "test" is not registered in the system.`,
        );
    }

    @AsyncTest()
    public async generateUrl() {
        const manager = new AppVideoConfProviderManager(this.mockManager);
        manager.addProvider('testing', TestData.getVideoConfProvider());
        manager.registerProviders('testing');

        const call = TestData.getVideoConfData();

        SpyOn(AppVideoConfProvider.prototype, 'runGenerateUrl').andReturn('test/first-call');
        const url = await manager.generateUrl('test', call);
        await Expect(url).toBe('test/first-call');
    }

    @AsyncTest()
    public async generateUrlWithMultipleProvidersAvailable() {
        const manager = new AppVideoConfProviderManager(this.mockManager);
        manager.addProvider('testing', TestData.getVideoConfProvider());
        manager.addProvider('testing', TestData.getVideoConfProvider('test2'));
        manager.registerProviders('testing');
        manager.addProvider('secondApp', TestData.getVideoConfProvider('differentProvider'));
        manager.registerProviders('secondApp');

        const call = TestData.getVideoConfData();

        const cases: any = [
            {
                name: 'test',
                call,
                runGenerateUrl: 'test/first-call',
                result: 'test/first-call',
            },
            {
                name: 'test2',
                call,
                runGenerateUrl: 'test2/first-call',
                result: 'test2/first-call',
            },
            {
                name: 'differentProvider',
                call,
                runGenerateUrl: 'differentProvider/first-call',
                result: 'differentProvider/first-call',
            },
        ];

        for (const c of cases) {
            SpyOn(AppVideoConfProvider.prototype, 'runGenerateUrl').andReturn(c.runGenerateUrl);
            await Expect(await manager.generateUrl(c.name, c.call)).toBe(c.result);
        }
    }

    @AsyncTest()
    public async failToGenerateUrlWithUnknownProvider() {
        const call = TestData.getVideoConfData();
        const manager = new AppVideoConfProviderManager(this.mockManager);
        await Expect(() => manager.generateUrl('unknownProvider', call)).toThrowErrorAsync(
            VideoConfProviderNotRegisteredError,
            `The video conference provider "unknownProvider" is not registered in the system.`,
        );
    }

    @AsyncTest()
    public async failToGenerateUrlWithUnregisteredProvider() {
        const call = TestData.getVideoConfData();
        const manager = new AppVideoConfProviderManager(this.mockManager);
        manager.addProvider('unregisteredApp', TestData.getVideoConfProvider('unregisteredProvider'));
        await Expect(() => manager.generateUrl('unregisteredProvider', call)).toThrowErrorAsync(
            VideoConfProviderNotRegisteredError,
            `The video conference provider "unregisteredProvider" is not registered in the system.`,
        );
    }

    @AsyncTest()
    public async failToCustomizeUrlWithoutProvider() {
        const manager = new AppVideoConfProviderManager(this.mockManager);
        const call = TestData.getVideoConfDataExtended();
        const user = TestData.getVideoConferenceUser();

        await Expect(() => manager.customizeUrl('test', call, user, {})).toThrowErrorAsync(
            VideoConfProviderNotRegisteredError,
            `The video conference provider "test" is not registered in the system.`,
        );

        manager.addProvider('testing', TestData.getVideoConfProvider());

        await Expect(() => manager.customizeUrl('test', call, user, {})).toThrowErrorAsync(
            VideoConfProviderNotRegisteredError,
            `The video conference provider "test" is not registered in the system.`,
        );
    }

    @AsyncTest()
    public async customizeUrl() {
        const manager = new AppVideoConfProviderManager(this.mockManager);
        manager.addProvider('testing', TestData.getVideoConfProvider());
        manager.registerProviders('testing');

        const call = TestData.getVideoConfDataExtended();
        const user = TestData.getVideoConferenceUser();

        const cases: any = [
            {
                name: 'test',
                call,
                user,
                options: {},
                runCustomizeUrl: 'test/first-call#caller',
                result: 'test/first-call#caller',
            },
            {
                name: 'test',
                call,
                user: undefined,
                options: {},
                runCustomizeUrl: 'test/first-call#',
                result: 'test/first-call#',
            },
        ];

        for (const c of cases) {
            SpyOn(AppVideoConfProvider.prototype, 'runCustomizeUrl').andReturn(c.runCustomizeUrl);
            await Expect(await manager.customizeUrl(c.name, c.call, c.user, c.options)).toBe(c.result);
        }
    }

    @AsyncTest()
    public async customizeUrlWithMultipleProvidersAvailable() {
        const manager = new AppVideoConfProviderManager(this.mockManager);
        manager.addProvider('testing', TestData.getVideoConfProvider());
        manager.addProvider('testing', TestData.getVideoConfProvider('test2'));
        manager.registerProviders('testing');
        manager.addProvider('secondApp', TestData.getVideoConfProvider('differentProvider'));
        manager.registerProviders('secondApp');

        const call = TestData.getVideoConfDataExtended();
        const user = TestData.getVideoConferenceUser();

        const cases = [
            {
                name: 'test',
                call,
                user,
                options: {},
                runCustomizeUrl: 'test/first-call#caller',
                result: 'test/first-call#caller',
            },
            {
                name: 'test',
                call,
                user: undefined,
                options: {},
                runCustomizeUrl: 'test/first-call#',
                result: 'test/first-call#',
            },
            {
                name: 'test2',
                call,
                user,
                options: {},
                runCustomizeUrl: 'test2/first-call#caller',
                result: 'test2/first-call#caller',
            },
            {
                name: 'test2',
                call,
                user: undefined,
                options: {},
                runCustomizeUrl: 'test2/first-call#',
                result: 'test2/first-call#',
            },
            {
                name: 'differentProvider',
                call,
                user,
                options: {},
                runCustomizeUrl: 'differentProvider/first-call#caller',
                result: 'differentProvider/first-call#caller',
            },
            {
                name: 'differentProvider',
                call,
                user: undefined,
                options: {},
                runCustomizeUrl: 'differentProvider/first-call#',
                result: 'differentProvider/first-call#',
            },
        ];

        for (const c of cases) {
            SpyOn(AppVideoConfProvider.prototype, 'runCustomizeUrl').andReturn(c.runCustomizeUrl);
            await Expect(await manager.customizeUrl(c.name, c.call, c.user, c.options)).toBe(c.result);
        }
    }

    @AsyncTest()
    public async failToCustomizeUrlWithUnknownProvider() {
        const call = TestData.getVideoConfDataExtended();
        const user = TestData.getVideoConferenceUser();
        const manager = new AppVideoConfProviderManager(this.mockManager);

        await Expect(() => manager.customizeUrl('unknownProvider', call, user, {})).toThrowErrorAsync(
            VideoConfProviderNotRegisteredError,
            `The video conference provider "unknownProvider" is not registered in the system.`,
        );
    }

    @AsyncTest()
    public async failToCustomizeUrlWithUnregisteredProvider() {
        const call = TestData.getVideoConfDataExtended();
        const user = TestData.getVideoConferenceUser();
        const manager = new AppVideoConfProviderManager(this.mockManager);

        manager.addProvider('unregisteredApp', TestData.getVideoConfProvider('unregisteredProvider'));
        await Expect(() => manager.customizeUrl('unregisteredProvider', call, user, {})).toThrowErrorAsync(
            VideoConfProviderNotRegisteredError,
            `The video conference provider "unregisteredProvider" is not registered in the system.`,
        );
    }
}
