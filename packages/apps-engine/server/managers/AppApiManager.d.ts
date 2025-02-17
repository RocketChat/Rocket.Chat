import type { IApi, IApiEndpointMetadata, IApiRequest, IApiResponse } from '../../definition/api';
import type { AppManager } from '../AppManager';
/**
 * The api manager for the Apps.
 *
 * An App will add api's during their `initialize` method.
 * Then once an App's `onEnable` is called and it returns true,
 * only then will that App's api's be enabled.
 */
export declare class AppApiManager {
    private readonly manager;
    private readonly bridge;
    private readonly accessors;
    private providedApis;
    constructor(manager: AppManager);
    /**
     * Adds an to *be* registered. This will *not register* it with the
     * bridged system yet as this is only called on an App's
     * `initialize` method and an App might not get enabled.
     * When adding an api, it can *not* already exist in the system.
     *
     * @param appId the app's id which the api belongs to
     * @param api the api to add to the system
     */
    addApi(appId: string, api: IApi): void;
    /**
     * Registers all of the api's for the provided app inside
     * of the bridged system which then enables them.
     *
     * @param appId The app's id of which to register it's api's with the bridged system
     */
    registerApis(appId: string): Promise<void>;
    /**
     * Unregisters the api's from the system.
     *
     * @param appId the appId for the api's to purge
     */
    unregisterApis(appId: string): Promise<void>;
    /**
     * Executes an App's api.
     *
     * @param appId the app which is providing the api
     * @param path the path to be executed in app's api's
     * @param request the request data to be evaluated byt the app
     */
    executeApi(appId: string, path: string, request: IApiRequest): Promise<IApiResponse>;
    /**
     * Return a list of api's for a certain app
     *
     * @param appId the app which is providing the api
     */
    listApis(appId: string): Array<IApiEndpointMetadata>;
    /**
     * Actually goes and provide's the bridged system with the api information.
     *
     * @param appId the app which is providing the api
     * @param info the api's registration information
     */
    private registerApi;
}
