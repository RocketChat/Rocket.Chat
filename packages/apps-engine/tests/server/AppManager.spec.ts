import { Expect, SetupFixture, Teardown, Test } from 'alsatian';

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
} from '../../src/server/managers';
import type { AppLogStorage, AppMetadataStorage, AppSourceStorage } from '../../src/server/storage';
import { SimpleClass, TestInfastructureSetup } from '../test-data/utilities';

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
    }
}
