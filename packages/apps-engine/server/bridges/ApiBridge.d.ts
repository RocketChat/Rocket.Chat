import { BaseBridge } from './BaseBridge';
import type { AppApi } from '../managers/AppApi';
export declare abstract class ApiBridge extends BaseBridge {
    doRegisterApi(api: AppApi, appId: string): Promise<void>;
    doUnregisterApis(appId: string): Promise<void>;
    /**
     * Registers an api with the system which is being bridged.
     *
     * @param api the api to register
     * @param appId the id of the app calling this
     */
    protected abstract registerApi(api: AppApi, appId: string): Promise<void>;
    /**
     * Unregisters all provided api's of an app from the bridged system.
     *
     * @param appId the id of the app calling this
     */
    protected abstract unregisterApis(appId: string): Promise<void>;
    private hasDefaultPermission;
}
