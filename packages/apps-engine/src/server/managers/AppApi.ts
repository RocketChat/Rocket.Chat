import type { IApi, IApiRequest, IApiResponse } from '../../definition/api';
import { ApiSecurity, ApiVisibility } from '../../definition/api';
import type { IApiEndpoint } from '../../definition/api/IApiEndpoint';
import type { IApiEndpointInfo } from '../../definition/api/IApiEndpointInfo';
import type { ProxiedApp } from '../ProxiedApp';
import type { AppLogStorage } from '../storage';
import type { AppAccessorManager } from './AppAccessorManager';

export class AppApi {
    public readonly computedPath: string;

    public readonly basePath: string;

    public readonly appId: string;

    public readonly hash?: string;

    public readonly implementedMethods: Array<string>;

    constructor(
        public app: ProxiedApp,
        public api: IApi,
        public endpoint: IApiEndpoint,
    ) {
        this.appId = app.getID();

        switch (this.api.visibility) {
            case ApiVisibility.PUBLIC:
                this.basePath = `/api/apps/public/${app.getID()}`;
                break;

            case ApiVisibility.PRIVATE:
                this.basePath = `/api/apps/private/${app.getID()}/${app.getStorageItem()._id}`;
                this.hash = app.getStorageItem()._id;
                break;
        }

        this.computedPath = `${this.basePath}/${endpoint.path}`;

        this.implementedMethods = endpoint._availableMethods;
    }

    public async runExecutor(request: IApiRequest, logStorage: AppLogStorage, accessors: AppAccessorManager): Promise<IApiResponse> {
        const { path } = this.endpoint;

        const { method } = request;

        if (!this.validateVisibility(request)) {
            return {
                status: 404,
            };
        }

        if (!this.validateSecurity(request)) {
            return {
                status: 401,
            };
        }

        const endpoint: IApiEndpointInfo = {
            basePath: this.basePath,
            fullPath: this.computedPath,
            appId: this.appId,
            hash: this.hash,
        };

        try {
            const result = await this.app.getDenoRuntime().sendRequest({
                method: `api:${path}:${method}`,
                params: [request, endpoint],
            });

            return result as IApiResponse;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    private validateVisibility(request: IApiRequest): boolean {
        if (this.api.visibility === ApiVisibility.PUBLIC) {
            return true;
        }

        if (this.api.visibility === ApiVisibility.PRIVATE) {
            return this.app.getStorageItem()._id === request.privateHash;
        }

        return false;
    }

    private validateSecurity(request: IApiRequest): boolean {
        if (this.api.security === ApiSecurity.UNSECURE) {
            return true;
        }

        return false;
    }
}
