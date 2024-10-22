import type { IUpload } from '../../definition/uploads';
import type { IUploadDetails } from '../../definition/uploads/IUploadDetails';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissionManager } from '../managers/AppPermissionManager';
import { AppPermissions } from '../permissions/AppPermissions';
import { BaseBridge } from './BaseBridge';

export abstract class UploadBridge extends BaseBridge {
    public async doGetById(id: string, appId: string): Promise<IUpload> {
        if (this.hasReadPermission(appId)) {
            return this.getById(id, appId);
        }
    }

    public async doGetBuffer(upload: IUpload, appId: string): Promise<Buffer> {
        if (this.hasReadPermission(appId)) {
            return this.getBuffer(upload, appId);
        }
    }

    public async doCreateUpload(details: IUploadDetails, buffer: Buffer, appId: string): Promise<IUpload> {
        if (this.hasWritePermission(appId)) {
            return this.createUpload(details, buffer, appId);
        }
    }

    protected abstract getById(id: string, appId: string): Promise<IUpload>;

    protected abstract getBuffer(upload: IUpload, appId: string): Promise<Buffer>;

    protected abstract createUpload(details: IUploadDetails, buffer: Buffer, appId: string): Promise<IUpload>;

    private hasReadPermission(appId: string): boolean {
        if (AppPermissionManager.hasPermission(appId, AppPermissions.upload.read)) {
            return true;
        }

        AppPermissionManager.notifyAboutError(
            new PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions.upload.read],
            }),
        );

        return false;
    }

    private hasWritePermission(appId: string): boolean {
        if (AppPermissionManager.hasPermission(appId, AppPermissions.upload.write)) {
            return true;
        }

        AppPermissionManager.notifyAboutError(
            new PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions.upload.write],
            }),
        );

        return false;
    }
}
