import type { RestorableFunctionSpy } from 'alsatian';
import { Expect, Setup, SetupFixture, SpyOn, Teardown, Test } from 'alsatian';

import type { AppManager } from '../../../src/server/AppManager';
import type { ProxiedApp } from '../../../src/server/ProxiedApp';
import type { AppBridges } from '../../../src/server/bridges';
import type {
    AppApiManager,
    AppExternalComponentManager,
    AppSchedulerManager,
    AppSlashCommandManager,
    AppVideoConfProviderManager,
} from '../../../src/server/managers';
import { AppAccessorManager } from '../../../src/server/managers';
import type { UIActionButtonManager } from '../../../src/server/managers/UIActionButtonManager';
import { TestsAppBridges } from '../../test-data/bridges/appBridges';

export class AppAccessorManagerTestFixture {
    private bridges: AppBridges;

    private manager: AppManager;

    private spies: Array<RestorableFunctionSpy>;

    @SetupFixture
    public setupFixture() {
        this.bridges = new TestsAppBridges();

        const brds = this.bridges;
        this.manager = {
            getBridges() {
                return brds;
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
                return appId === 'testing' ? ({} as ProxiedApp) : undefined;
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
    }

    @Setup
    public setup() {
        this.spies = [];
        this.spies.push(SpyOn(this.bridges, 'getServerSettingBridge'));
        this.spies.push(SpyOn(this.bridges, 'getEnvironmentalVariableBridge'));
        this.spies.push(SpyOn(this.bridges, 'getMessageBridge'));
        this.spies.push(SpyOn(this.bridges, 'getPersistenceBridge'));
        this.spies.push(SpyOn(this.bridges, 'getRoomBridge'));
        this.spies.push(SpyOn(this.bridges, 'getUserBridge'));
        this.spies.push(SpyOn(this.manager, 'getBridges'));
        this.spies.push(SpyOn(this.manager, 'getCommandManager'));
        this.spies.push(SpyOn(this.manager, 'getExternalComponentManager'));
        this.spies.push(SpyOn(this.manager, 'getApiManager'));
    }

    @Teardown
    public teardown() {
        this.spies.forEach((s) => s.restore());
    }

    @Test()
    public basicAppAccessorManager() {
        Expect(() => new AppAccessorManager(this.manager)).not.toThrow();
        Expect(() => new AppAccessorManager(this.manager).purifyApp('testing')).not.toThrow();
    }

    @Test()
    public configurationExtend() {
        const acm = new AppAccessorManager(this.manager);

        Expect(acm.getConfigurationExtend('testing')).toBeDefined();
        Expect(() => acm.getConfigurationExtend('fake')).toThrowError(Error, 'No App found by the provided id: fake');
        Expect(acm.getConfigurationExtend('testing')).toBeDefined();

        Expect(this.manager.getExternalComponentManager).toHaveBeenCalled().exactly(1);
        Expect(this.manager.getCommandManager).toHaveBeenCalled().exactly(1);
        Expect(this.manager.getApiManager).toHaveBeenCalled().exactly(1);
    }

    @Test()
    public environmentRead() {
        const acm = new AppAccessorManager(this.manager);

        Expect(acm.getEnvironmentRead('testing')).toBeDefined();
        Expect(() => acm.getEnvironmentRead('fake')).toThrowError(Error, 'No App found by the provided id: fake');
        Expect(acm.getEnvironmentRead('testing')).toBeDefined();

        Expect(this.bridges.getServerSettingBridge).toHaveBeenCalled().exactly(1);
        Expect(this.bridges.getEnvironmentalVariableBridge).toHaveBeenCalled().exactly(1);
    }

    @Test()
    public configurationModify() {
        const acm = new AppAccessorManager(this.manager);

        Expect(acm.getConfigurationModify('testing')).toBeDefined();
        Expect(acm.getConfigurationModify('testing')).toBeDefined();

        Expect(this.bridges.getServerSettingBridge).toHaveBeenCalled().exactly(1);
        Expect(this.manager.getCommandManager).toHaveBeenCalled().exactly(1);
    }

    @Test()
    public reader() {
        const acm = new AppAccessorManager(this.manager);

        Expect(acm.getReader('testing')).toBeDefined();
        Expect(acm.getReader('testing')).toBeDefined();

        Expect(this.bridges.getServerSettingBridge).toHaveBeenCalled().exactly(1);
        Expect(this.bridges.getEnvironmentalVariableBridge).toHaveBeenCalled().exactly(1);
        Expect(this.bridges.getPersistenceBridge).toHaveBeenCalled().exactly(1);
        Expect(this.bridges.getRoomBridge).toHaveBeenCalled().exactly(1);
        Expect(this.bridges.getUserBridge).toHaveBeenCalled().exactly(2);
        Expect(this.bridges.getMessageBridge).toHaveBeenCalled().exactly(2);
    }

    @Test()
    public modifier() {
        const acm = new AppAccessorManager(this.manager);

        Expect(acm.getModifier('testing')).toBeDefined();
        Expect(acm.getModifier('testing')).toBeDefined();

        Expect(this.manager.getBridges).toHaveBeenCalled().exactly(1);
        Expect(this.bridges.getMessageBridge).toHaveBeenCalled().exactly(1);
    }

    @Test()
    public persistence() {
        const acm = new AppAccessorManager(this.manager);

        Expect(acm.getPersistence('testing')).toBeDefined();
        Expect(acm.getPersistence('testing')).toBeDefined();

        Expect(this.bridges.getPersistenceBridge).toHaveBeenCalled().exactly(1);
    }

    @Test()
    public http() {
        const acm = new AppAccessorManager(this.manager);

        Expect(acm.getHttp('testing')).toBeDefined();
        Expect(acm.getHttp('testing')).toBeDefined();

        (acm as any).https.delete('testing');
        Expect(acm.getHttp('testing')).toBeDefined();
    }
}
