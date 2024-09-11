import { AppStatusUtils } from '../../definition/AppStatus';
import { HttpStatusCode } from '../../definition/accessors';
import type { IApi, IApiEndpointMetadata, IApiRequest, IApiResponse } from '../../definition/api';
import type { AppManager } from '../AppManager';
import type { ApiBridge } from '../bridges';
import { PathAlreadyExistsError } from '../errors';
import type { AppAccessorManager } from './AppAccessorManager';
import { AppApi } from './AppApi';

/**
 * The api manager for the Apps.
 *
 * An App will add api's during their `initialize` method.
 * Then once an App's `onEnable` is called and it returns true,
 * only then will that App's api's be enabled.
 */
export class AppApiManager {
    private readonly bridge: ApiBridge;

    private readonly accessors: AppAccessorManager;

    // Variable that contains the api's which have been provided by apps.
    // The key of the top map is app id and the key of the inner map is the path
    private providedApis: Map<string, Map<string, AppApi>>;

    constructor(private readonly manager: AppManager) {
        this.bridge = this.manager.getBridges().getApiBridge();
        this.accessors = this.manager.getAccessorManager();
        this.providedApis = new Map<string, Map<string, AppApi>>();
    }

    /**
     * Adds an to *be* registered. This will *not register* it with the
     * bridged system yet as this is only called on an App's
     * `initialize` method and an App might not get enabled.
     * When adding an api, it can *not* already exist in the system.
     *
     * @param appId the app's id which the api belongs to
     * @param api the api to add to the system
     */
    public addApi(appId: string, api: IApi): void {
        if (api.endpoints.length === 0) {
            throw new Error('Invalid Api parameter provided, endpoints must contain, at least, one IApiEndpoint.');
        }

        const app = this.manager.getOneById(appId);
        if (!app) {
            throw new Error('App must exist in order for an api to be added.');
        }

        // Verify the api's path doesn't exist already
        if (this.providedApis.get(appId)) {
            api.endpoints.forEach((endpoint) => {
                if (this.providedApis.get(appId).has(endpoint.path)) {
                    throw new PathAlreadyExistsError(endpoint.path);
                }
            });
        }

        if (!this.providedApis.has(appId)) {
            this.providedApis.set(appId, new Map<string, AppApi>());
        }

        api.endpoints.forEach((endpoint) => {
            this.providedApis.get(appId).set(endpoint.path, new AppApi(app, api, endpoint));
        });
    }

    /**
     * Registers all of the api's for the provided app inside
     * of the bridged system which then enables them.
     *
     * @param appId The app's id of which to register it's api's with the bridged system
     */
    public async registerApis(appId: string): Promise<void> {
        if (!this.providedApis.has(appId)) {
            return;
        }

        await this.bridge.doUnregisterApis(appId);
        for await (const [, apiApp] of this.providedApis.get(appId).entries()) {
            await this.registerApi(appId, apiApp);
        }
    }

    /**
     * Unregisters the api's from the system.
     *
     * @param appId the appId for the api's to purge
     */
    public async unregisterApis(appId: string): Promise<void> {
        if (this.providedApis.has(appId)) {
            await this.bridge.doUnregisterApis(appId);

            this.providedApis.delete(appId);
        }
    }

    /**
     * Executes an App's api.
     *
     * @param appId the app which is providing the api
     * @param path the path to be executed in app's api's
     * @param request the request data to be evaluated byt the app
     */
    public async executeApi(appId: string, path: string, request: IApiRequest): Promise<IApiResponse> {
        const api = this.providedApis.get(appId).get(path);

        if (!api) {
            return {
                status: HttpStatusCode.NOT_FOUND,
            };
        }

        const app = this.manager.getOneById(appId);

        if (!app || AppStatusUtils.isDisabled(await app.getStatus())) {
            // Just in case someone decides to do something they shouldn't
            // let's ensure the app actually exists
            return {
                status: HttpStatusCode.NOT_FOUND,
            };
        }

        return api.runExecutor(request, this.manager.getLogStorage(), this.accessors);
    }

    /**
     * Return a list of api's for a certain app
     *
     * @param appId the app which is providing the api
     */
    public listApis(appId: string): Array<IApiEndpointMetadata> {
        const apis = this.providedApis.get(appId);

        if (!apis) {
            return [];
        }

        const result = [];

        for (const api of apis.values()) {
            const metadata: IApiEndpointMetadata = {
                path: api.endpoint.path,
                computedPath: api.computedPath,
                methods: api.implementedMethods,
                examples: api.endpoint.examples || {},
            };

            result.push(metadata);
        }

        return result;
    }

    /**
     * Actually goes and provide's the bridged system with the api information.
     *
     * @param appId the app which is providing the api
     * @param info the api's registration information
     */
    private async registerApi(appId: string, api: AppApi): Promise<void> {
        await this.bridge.doRegisterApi(api, appId);
    }
}
