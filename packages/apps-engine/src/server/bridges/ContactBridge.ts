import type { ILivechatContact } from '../../definition/livechat/ILivechatContact';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissionManager } from '../managers/AppPermissionManager';
import { AppPermissions } from '../permissions/AppPermissions';
import { BaseBridge } from './BaseBridge';

type VerifyContactChannelParams = {
    contactId: string;
    field: string;
    value: string;
    channelName: string;
    visitorId: string;
    roomId: string;
};

export abstract class ContactBridge extends BaseBridge {
    public async doGetById(id: ILivechatContact['_id'], appId: string): Promise<ILivechatContact> {
        if (this.hasReadPermission(appId)) {
            return this.getById(id);
        }
    }

    public async doVerifyContact(verifyContactChannelParams: VerifyContactChannelParams, appId: string): Promise<void> {
        if (this.hasWritePermission(appId)) {
            return this.verifyContact(verifyContactChannelParams);
        }
    }

    protected abstract getById(id: ILivechatContact['_id']): Promise<ILivechatContact>;

    protected abstract verifyContact(verifyContactChannelParams: VerifyContactChannelParams): Promise<void>;

    private hasReadPermission(appId: string): boolean {
        if (AppPermissionManager.hasPermission(appId, AppPermissions.contact.read)) {
            return true;
        }

        AppPermissionManager.notifyAboutError(
            new PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions.contact.read],
            }),
        );

        return false;
    }

    private hasWritePermission(appId: string): boolean {
        if (AppPermissionManager.hasPermission(appId, AppPermissions.contact.write)) {
            return true;
        }

        AppPermissionManager.notifyAboutError(
            new PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions.contact.write],
            }),
        );

        return false;
    }
}
