import { BaseBridge } from './BaseBridge';
import type { IRole } from '../../definition/roles';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissionManager } from '../managers/AppPermissionManager';
import { AppPermissions } from '../permissions/AppPermissions';

export abstract class RoleBridge extends BaseBridge {
    public async doGetOneByIdOrName(idOrName: IRole['id'] | IRole['name'], appId: string): Promise<IRole | null> {
        if (this.hasReadPermission(appId)) {
            return this.getOneByIdOrName(idOrName, appId);
        }
    }

    public async doGetCustomRoles(appId: string): Promise<Array<IRole>> {
        if (this.hasReadPermission(appId)) {
            return this.getCustomRoles(appId);
        }
    }

    protected abstract getOneByIdOrName(idOrName: IRole['id'] | IRole['name'], appId: string): Promise<IRole | null>;

    protected abstract getCustomRoles(appId: string): Promise<Array<IRole>>;

    private hasReadPermission(appId: string): boolean {
        if (AppPermissionManager.hasPermission(appId, AppPermissions.role.read)) {
            return true;
        }

        AppPermissionManager.notifyAboutError(
            new PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions.role.read],
            }),
        );

        return false;
    }
}
