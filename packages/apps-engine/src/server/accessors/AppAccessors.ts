import type { IAppAccessors, IEnvironmentRead, IEnvironmentWrite, IHttp, IRead } from '../../definition/accessors';
import type { IApiEndpointMetadata } from '../../definition/api';
import type { AppManager } from '../AppManager';
import type { AppAccessorManager } from '../managers/AppAccessorManager';
import type { AppApiManager } from '../managers/AppApiManager';

export class AppAccessors implements IAppAccessors {
    private accessorManager: AppAccessorManager;

    private apiManager: AppApiManager;

    constructor(
        manager: AppManager,
        private readonly appId: string,
    ) {
        this.accessorManager = manager.getAccessorManager();
        this.apiManager = manager.getApiManager();
    }

    public get environmentReader(): IEnvironmentRead {
        return this.accessorManager.getEnvironmentRead(this.appId);
    }

    public get environmentWriter(): IEnvironmentWrite {
        return this.accessorManager.getEnvironmentWrite(this.appId);
    }

    public get reader(): IRead {
        return this.accessorManager.getReader(this.appId);
    }

    public get http(): IHttp {
        return this.accessorManager.getHttp(this.appId);
    }

    public get providedApiEndpoints(): Array<IApiEndpointMetadata> {
        return this.apiManager.listApis(this.appId);
    }
}
