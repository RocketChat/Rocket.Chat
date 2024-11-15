import type { IApi, IApiRequest, IApiResponse } from '../../definition/api';
import type { IApiEndpoint } from '../../definition/api/IApiEndpoint';
import type { ProxiedApp } from '../ProxiedApp';
import type { AppLogStorage } from '../storage';
import type { AppAccessorManager } from './AppAccessorManager';
export declare class AppApi {
    app: ProxiedApp;
    api: IApi;
    endpoint: IApiEndpoint;
    readonly computedPath: string;
    readonly basePath: string;
    readonly appId: string;
    readonly hash?: string;
    readonly implementedMethods: Array<string>;
    constructor(app: ProxiedApp, api: IApi, endpoint: IApiEndpoint);
    runExecutor(request: IApiRequest, logStorage: AppLogStorage, accessors: AppAccessorManager): Promise<IApiResponse>;
    private validateVisibility;
    private validateSecurity;
}
