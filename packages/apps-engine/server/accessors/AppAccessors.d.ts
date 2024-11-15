import type { IAppAccessors, IEnvironmentRead, IEnvironmentWrite, IHttp, IRead } from '../../definition/accessors';
import type { IApiEndpointMetadata } from '../../definition/api';
import type { AppManager } from '../AppManager';
export declare class AppAccessors implements IAppAccessors {
    private readonly appId;
    private accessorManager;
    private apiManager;
    constructor(manager: AppManager, appId: string);
    get environmentReader(): IEnvironmentRead;
    get environmentWriter(): IEnvironmentWrite;
    get reader(): IRead;
    get http(): IHttp;
    get providedApiEndpoints(): Array<IApiEndpointMetadata>;
}
