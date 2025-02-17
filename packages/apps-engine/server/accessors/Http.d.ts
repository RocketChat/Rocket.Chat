import type { IHttp, IHttpExtend, IHttpRequest, IHttpResponse } from '../../definition/accessors';
import type { AppBridges } from '../bridges/AppBridges';
import type { AppAccessorManager } from '../managers/AppAccessorManager';
export declare class Http implements IHttp {
    private readonly accessManager;
    private readonly bridges;
    private readonly httpExtender;
    private readonly appId;
    constructor(accessManager: AppAccessorManager, bridges: AppBridges, httpExtender: IHttpExtend, appId: string);
    get(url: string, options?: IHttpRequest): Promise<IHttpResponse>;
    put(url: string, options?: IHttpRequest): Promise<IHttpResponse>;
    post(url: string, options?: IHttpRequest): Promise<IHttpResponse>;
    del(url: string, options?: IHttpRequest): Promise<IHttpResponse>;
    patch(url: string, options?: IHttpRequest): Promise<IHttpResponse>;
    private _processHandler;
}
