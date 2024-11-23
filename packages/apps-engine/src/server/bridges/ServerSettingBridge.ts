import { BaseBridge } from './BaseBridge';
import type { ISetting } from '../../definition/settings';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissionManager } from '../managers/AppPermissionManager';
import { AppPermissions } from '../permissions/AppPermissions';

export abstract class ServerSettingBridge extends BaseBridge {
    public async doGetAll(appId: string): Promise<Array<ISetting>> {
        if (this.hasReadPermission(appId)) {
            return this.getAll(appId);
        }
    }

    public async doGetOneById(id: string, appId: string): Promise<ISetting> {
        if (this.hasReadPermission(appId)) {
            return this.getOneById(id, appId);
        }
    }

    public async doHideGroup(name: string, appId: string): Promise<void> {
        if (this.hasWritePermission(appId)) {
            return this.hideGroup(name, appId);
        }
    }

    public async doHideSetting(id: string, appId: string): Promise<void> {
        if (this.hasWritePermission(appId)) {
            return this.hideSetting(id, appId);
        }
    }

    public async doIsReadableById(id: string, appId: string): Promise<boolean> {
        if (this.hasReadPermission(appId)) {
            return this.isReadableById(id, appId);
        }
    }

    public async doUpdateOne(setting: ISetting, appId: string): Promise<void> {
        if (this.hasWritePermission(appId)) {
            return this.updateOne(setting, appId);
        }
    }

    public async doIncrementValue(id: ISetting['id'], value: number, appId: string): Promise<void> {
        if (this.hasWritePermission(appId)) {
            return this.incrementValue(id, value, appId);
        }
    }

    protected abstract getAll(appId: string): Promise<Array<ISetting>>;

    protected abstract getOneById(id: string, appId: string): Promise<ISetting>;

    protected abstract hideGroup(name: string, appId: string): Promise<void>;

    protected abstract hideSetting(id: string, appId: string): Promise<void>;

    protected abstract isReadableById(id: string, appId: string): Promise<boolean>;

    protected abstract updateOne(setting: ISetting, appId: string): Promise<void>;

    protected abstract incrementValue(id: ISetting['id'], value: number, appId: string): Promise<void>;

    private hasWritePermission(appId: string): boolean {
        if (AppPermissionManager.hasPermission(appId, AppPermissions.setting.write)) {
            return true;
        }

        AppPermissionManager.notifyAboutError(
            new PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions.setting.write],
            }),
        );

        return false;
    }

    private hasReadPermission(appId: string): boolean {
        if (AppPermissionManager.hasPermission(appId, AppPermissions.setting.read)) {
            return true;
        }

        AppPermissionManager.notifyAboutError(
            new PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions.setting.read],
            }),
        );

        return false;
    }
}
