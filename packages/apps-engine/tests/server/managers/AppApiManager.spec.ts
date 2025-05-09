import type { FunctionSpy, RestorableFunctionSpy } from 'alsatian';
import { AsyncTest, Expect, Setup, SetupFixture, SpyOn, Teardown, Test } from 'alsatian';

import { AppStatus } from '../../../src/definition/AppStatus';
import { RequestMethod } from '../../../src/definition/accessors';
import type { IApi, IApiRequest } from '../../../src/definition/api';
import type { AppMethod } from '../../../src/definition/metadata';
import type { AppManager } from '../../../src/server/AppManager';
import type { ProxiedApp } from '../../../src/server/ProxiedApp';
import type { AppBridges } from '../../../src/server/bridges';
import { PathAlreadyExistsError } from '../../../src/server/errors';
import { AppConsole } from '../../../src/server/logging';
import type { AppExternalComponentManager, AppSchedulerManager, AppSlashCommandManager, AppVideoConfProviderManager } from '../../../src/server/managers';
import { AppAccessorManager, AppApiManager } from '../../../src/server/managers';
import { AppApi } from '../../../src/server/managers/AppApi';
import type { UIActionButtonManager } from '../../../src/server/managers/UIActionButtonManager';
import type { AppsEngineRuntime } from '../../../src/server/runtime/AppsEngineRuntime';
import type { DenoRuntimeSubprocessController } from '../../../src/server/runtime/deno/AppsEngineDenoRuntime';
import type { AppLogStorage } from '../../../src/server/storage';
import { TestsAppBridges } from '../../test-data/bridges/appBridges';
import { TestsAppLogStorage } from '../../test-data/storage/logStorage';
import { TestData } from '../../test-data/utilities';

export class AppApiManagerTestFixture {
    public static doThrow = false;

    private mockBridges: TestsAppBridges;

    private mockApp: ProxiedApp;

    private mockAccessors: AppAccessorManager;

    private mockManager: AppManager;

    private spies: Array<RestorableFunctionSpy>;

    @SetupFixture
    public setupFixture() {
        this.mockBridges = new TestsAppBridges();

        this.mockApp = {
            getRuntime() {
                return {
                    runInSandbox: () => Promise.resolve(true),
                } as AppsEngineRuntime;
            },
            getDenoRuntime() {
                return {
                    sendRequest: () => Promise.resolve(true),
                } as unknown as DenoRuntimeSubprocessController;
            },
            getID() {
                return 'testing';
            },
            getStatus() {
                return Promise.resolve(AppStatus.AUTO_ENABLED);
            },
            setupLogger(method: AppMethod): AppConsole {
                return new AppConsole(method);
            },
        } as ProxiedApp;

        const bri = this.mockBridges;
        const app = this.mockApp;
        this.mockManager = {
            getBridges(): AppBridges {
                return bri;
            },
            getCommandManager() {
                return {} as AppSlashCommandManager;
            },
            getExternalComponentManager() {
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
    public setup() {
        this.mockBridges = new TestsAppBridges();
        const bri = this.mockBridges;
        this.mockManager.getBridges = function _refreshedGetBridges(): AppBridges {
            return bri;
        };

        this.spies = [];
        this.spies.push(SpyOn(this.mockBridges.getApiBridge(), 'doRegisterApi'));
        this.spies.push(SpyOn(this.mockBridges.getApiBridge(), 'doUnregisterApis'));
    }

    @Teardown
    public teardown() {
        this.spies.forEach((s) => s.restore());
    }

    @Test()
    public basicAppApiManager() {
        Expect(() => new AppApiManager({} as AppManager)).toThrow();
        Expect(() => new AppApiManager(this.mockManager)).not.toThrow();

        const ascm = new AppApiManager(this.mockManager);
        Expect((ascm as any).manager).toBe(this.mockManager);
        Expect((ascm as any).bridge).toBe(this.mockBridges.getApiBridge());
        Expect((ascm as any).accessors).toBe(this.mockManager.getAccessorManager());
        Expect((ascm as any).providedApis).toBeDefined();
        Expect((ascm as any).providedApis.size).toBe(0);
    }

    @AsyncTest()
    public async registerApi() {
        const ascm = new AppApiManager(this.mockManager);

        const api: IApi = TestData.getApi('path');
        const regInfo = new AppApi(this.mockApp, api, api.endpoints[0]);

        await Expect(() => (ascm as any).registerApi('testing', regInfo)).not.toThrowAsync();
        Expect(this.mockBridges.getApiBridge().doRegisterApi).toHaveBeenCalledWith(regInfo, 'testing');
    }

    @Test()
    public addApi() {
        const api = TestData.getApi('apipath');
        const ascm = new AppApiManager(this.mockManager);

        Expect(() => ascm.addApi('testing', api)).not.toThrow();
        Expect(this.mockBridges.getApiBridge().apis.size).toBe(1);
        Expect((ascm as any).providedApis.size).toBe(1);
        Expect((ascm as any).providedApis.get('testing').get('apipath').api).toBe(api);

        Expect(() => ascm.addApi('testing', api)).toThrowError(PathAlreadyExistsError, 'The api path "apipath" already exists in the system.');

        Expect(() => ascm.addApi('failMePlease', TestData.getApi('yet-another'))).toThrowError(Error, 'App must exist in order for an api to be added.');
        Expect(() => ascm.addApi('testing', TestData.getApi('another-api'))).not.toThrow();
        Expect((ascm as any).providedApis.size).toBe(1);
        Expect((ascm as any).providedApis.get('testing').size).toBe(2);
    }

    @AsyncTest()
    public async registerApis() {
        const ascm = new AppApiManager(this.mockManager);

        SpyOn(ascm, 'registerApi');

        ascm.addApi('testing', TestData.getApi('apipath'));
        const regInfo = (ascm as any).providedApis.get('testing').get('apipath') as AppApi;

        await Expect(() => ascm.registerApis('non-existant')).not.toThrowAsync();
        await Expect(() => ascm.registerApis('testing')).not.toThrowAsync();
        Expect((ascm as any).registerApi as FunctionSpy)
            .toHaveBeenCalledWith('testing', regInfo)
            .exactly(1);
        Expect(this.mockBridges.getApiBridge().doRegisterApi).toHaveBeenCalledWith(regInfo, 'testing').exactly(1);
    }

    @AsyncTest()
    public async unregisterApis() {
        const ascm = new AppApiManager(this.mockManager);

        ascm.addApi('testing', TestData.getApi('apipath'));

        await Expect(() => ascm.unregisterApis('non-existant')).not.toThrowAsync();
        await Expect(() => ascm.unregisterApis('testing')).not.toThrowAsync();
        Expect(this.mockBridges.getApiBridge().doUnregisterApis).toHaveBeenCalled().exactly(1);
    }

    @AsyncTest()
    public async executeApis() {
        const ascm = new AppApiManager(this.mockManager);
        ascm.addApi('testing', TestData.getApi('api1'));
        ascm.addApi('testing', TestData.getApi('api2'));
        ascm.addApi('testing', TestData.getApi('api3'));
        ascm.registerApis('testing');

        const request: IApiRequest = {
            method: RequestMethod.GET,
            headers: {},
            query: {},
            params: {},
            content: '',
        };

        await Expect(() => ascm.executeApi('testing', 'nope', request)).not.toThrowAsync();
        await Expect(() => ascm.executeApi('testing', 'not-exists', request)).not.toThrowAsync();
        await Expect(() => ascm.executeApi('testing', 'api1', request)).not.toThrowAsync();
        await Expect(() => ascm.executeApi('testing', 'api2', request)).not.toThrowAsync();
        await Expect(() => ascm.executeApi('testing', 'api3', request)).not.toThrowAsync();
    }

    @Test()
    public listApis() {
        const ascm = new AppApiManager(this.mockManager);

        Expect(ascm.listApis('testing')).toEqual([]);

        ascm.addApi('testing', TestData.getApi('api1'));
        ascm.registerApis('testing');

        Expect(() => ascm.listApis('testing')).not.toThrow();
        Expect(ascm.listApis('testing')).not.toEqual([]);
        Expect(ascm.listApis('testing')).toEqual([
            {
                path: 'api1',
                computedPath: '/api/apps/public/testing/api1',
                methods: ['get'],
                examples: {},
            },
        ]);
    }
}
