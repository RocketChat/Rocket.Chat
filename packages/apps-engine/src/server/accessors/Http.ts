import type { IHttp, IHttpExtend, IHttpRequest, IHttpResponse } from '../../definition/accessors';
import { RequestMethod } from '../../definition/accessors';
import type { AppBridges } from '../bridges/AppBridges';
import type { AppAccessorManager } from '../managers/AppAccessorManager';

export class Http implements IHttp {
    constructor(
        private readonly accessManager: AppAccessorManager,
        private readonly bridges: AppBridges,
        private readonly httpExtender: IHttpExtend,
        private readonly appId: string,
    ) {}

    public get(url: string, options?: IHttpRequest): Promise<IHttpResponse> {
        return this._processHandler(url, RequestMethod.GET, options);
    }

    public put(url: string, options?: IHttpRequest): Promise<IHttpResponse> {
        return this._processHandler(url, RequestMethod.PUT, options);
    }

    public post(url: string, options?: IHttpRequest): Promise<IHttpResponse> {
        return this._processHandler(url, RequestMethod.POST, options);
    }

    public del(url: string, options?: IHttpRequest): Promise<IHttpResponse> {
        return this._processHandler(url, RequestMethod.DELETE, options);
    }

    public patch(url: string, options?: IHttpRequest): Promise<IHttpResponse> {
        return this._processHandler(url, RequestMethod.PATCH, options);
    }

    private async _processHandler(url: string, method: RequestMethod, options?: IHttpRequest): Promise<IHttpResponse> {
        let request = options || {};

        if (typeof request.headers === 'undefined') {
            request.headers = {};
        }

        this.httpExtender.getDefaultHeaders().forEach((value: string, key: string) => {
            if (typeof request.headers[key] !== 'string') {
                request.headers[key] = value;
            }
        });

        if (typeof request.params === 'undefined') {
            request.params = {};
        }

        this.httpExtender.getDefaultParams().forEach((value: string, key: string) => {
            if (typeof request.params[key] !== 'string') {
                request.params[key] = value;
            }
        });

        const reader = this.accessManager.getReader(this.appId);
        const persis = this.accessManager.getPersistence(this.appId);

        for (const handler of this.httpExtender.getPreRequestHandlers()) {
            request = await handler.executePreHttpRequest(url, request, reader, persis);
        }

        let response = await this.bridges.getHttpBridge().doCall({
            appId: this.appId,
            method,
            url,
            request,
        });

        for (const handler of this.httpExtender.getPreResponseHandlers()) {
            response = await handler.executePreHttpResponse(response, reader, persis);
        }

        return response;
    }
}
