import type { IApi } from '../../../src/definition/api';
import { ApiBridge } from '../../../src/server/bridges';
import type { AppApi } from '../../../src/server/managers/AppApi';
import { TestData } from '../utilities';

export class TestsApiBridge extends ApiBridge {
    public apis: Map<string, Map<string, IApi>>;

    constructor() {
        super();
        this.apis = new Map<string, Map<string, IApi>>();
        this.apis.set('appId', new Map<string, IApi>());
        this.apis.get('appId').set('it-exists', TestData.getApi('it-exists'));
    }

    public async registerApi(api: AppApi, appId: string): Promise<void> {
        if (!this.apis.has(appId)) {
            this.apis.set(appId, new Map<string, IApi>());
        }

        if (this.apis.get(appId)) {
            api.api.endpoints.forEach((endpoint) => {
                if (this.apis.get(appId).has(endpoint.path)) {
                    throw new Error(`Api "${api.endpoint.path}" has already been registered for app ${appId}.`);
                }
            });

            api.api.endpoints.forEach((endpoint) => {
                this.apis.get(appId).set(api.endpoint.path, api.api);
            });
        }
    }

    public async unregisterApis(appId: string): Promise<void> {
        this.apis.delete(appId);
    }
}
