import { Expect, SetupFixture, Test } from 'alsatian';

import type { IApi } from '../../../src/definition/api';
import type { IApiEndpoint } from '../../../src/definition/api/IApiEndpoint';
import type { ProxiedApp } from '../../../src/server/ProxiedApp';
import { AppApi } from '../../../src/server/managers/AppApi';

export class AppApiRegistrationTestFixture {
    private mockApp: ProxiedApp;

    @SetupFixture
    public setupFixture() {
        this.mockApp = {
            getID() {
                return 'id';
            },
        } as ProxiedApp;
    }

    @Test()
    public ensureAppApi() {
        Expect(() => new AppApi(this.mockApp, {} as IApi, {} as IApiEndpoint)).not.toThrow();

        const ascr = new AppApi(this.mockApp, {} as IApi, {} as IApiEndpoint);
        Expect(ascr.app).toBeDefined();
        Expect(ascr.api).toBeDefined();
    }
}
