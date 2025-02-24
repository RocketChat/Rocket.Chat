import type { ILivechatContact } from '../../definition/livechat/ILivechatContact';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissionManager } from '../managers/AppPermissionManager';
import { AppPermissions } from '../permissions/AppPermissions';
import { BaseBridge } from './BaseBridge';

export type VerifyContactChannelParams = {
    contactId: string;
    field: string;
    value: string;
    visitorId: string;
    roomId: string;
};

export abstract class ContactBridge extends BaseBridge {
    public async doGetById(contactId: ILivechatContact['_id'], appId: string): Promise<ILivechatContact | undefined> {
        if (this.hasReadPermission(appId)) {
            return this.getById(contactId, appId);
        }
    }

    public async doVerifyContact(verifyContactChannelParams: VerifyContactChannelParams, appId: string): Promise<void> {
        if (this.hasWritePermission(appId)) {
            return this.verifyContact(verifyContactChannelParams, appId);
        }
    }

    public async doAddContactEmail(contactId: ILivechatContact['_id'], email: string, appId: string): Promise<ILivechatContact> {
        if (this.hasWritePermission(appId)) {
            return this.addContactEmail(contactId, email, appId);
        }
    }

    protected abstract getById(contactId: ILivechatContact['_id'], appId: string): Promise<ILivechatContact | undefined>;

    protected abstract verifyContact(verifyContactChannelParams: VerifyContactChannelParams, appId: string): Promise<void>;

    protected abstract addContactEmail(contactId: ILivechatContact['_id'], email: string, appId: string): Promise<ILivechatContact>;

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
