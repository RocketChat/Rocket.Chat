import { Expect, Test } from 'alsatian';

import { AppStatus } from '../../../src/definition/AppStatus';
import type { IAppInfo } from '../../../src/definition/metadata';
import { AppInterface } from '../../../src/definition/metadata';
import type { AppManager } from '../../../src/server/AppManager';
import { ProxiedApp } from '../../../src/server/ProxiedApp';
import { AppFabricationFulfillment } from '../../../src/server/compiler';
import type { DenoRuntimeSubprocessController } from '../../../src/server/runtime/deno/AppsEngineDenoRuntime';
import type { IAppStorageItem } from '../../../src/server/storage';
import { EventEmitter } from 'stream';

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

        const fakeApp = new ProxiedApp({} as AppManager, { status: AppStatus.UNKNOWN } as IAppStorageItem, new EventEmitter() as DenoRuntimeSubprocessController);
        Expect(() => aff.setApp(fakeApp)).not.toThrow();
        Expect(aff.getApp()).toEqual(fakeApp);
    }
}
