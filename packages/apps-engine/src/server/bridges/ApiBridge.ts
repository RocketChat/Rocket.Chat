import { BaseBridge } from './BaseBridge';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import type { AppApi } from '../managers/AppApi';
import { AppPermissionManager } from '../managers/AppPermissionManager';
import { AppPermissions } from '../permissions/AppPermissions';

export abstract class ApiBridge extends BaseBridge {
    public async doRegisterApi(api: AppApi, appId: string): Promise<void> {
        if (this.hasDefaultPermission(appId)) {
            return this.registerApi(api, appId);
        }
    }

    public async doUnregisterApis(appId: string): Promise<void> {
        if (this.hasDefaultPermission(appId)) {
            return this.unregisterApis(appId);
        }
    }

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

    private hasDefaultPermission(appId: string): boolean {
        if (AppPermissionManager.hasPermission(appId, AppPermissions.apis.default)) {
            return true;
        }

        AppPermissionManager.notifyAboutError(
            new PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions.apis.default],
            }),
        );

        return false;
    }
}
