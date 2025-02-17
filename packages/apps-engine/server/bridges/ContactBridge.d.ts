import type { ILivechatContact } from '../../definition/livechat/ILivechatContact';
import { BaseBridge } from './BaseBridge';
export type VerifyContactChannelParams = {
    contactId: string;
    field: string;
    value: string;
    visitorId: string;
    roomId: string;
};
export declare abstract class ContactBridge extends BaseBridge {
    doGetById(contactId: ILivechatContact['_id'], appId: string): Promise<ILivechatContact | undefined>;
    doVerifyContact(verifyContactChannelParams: VerifyContactChannelParams, appId: string): Promise<void>;
    doAddContactEmail(contactId: ILivechatContact['_id'], email: string, appId: string): Promise<ILivechatContact>;
    protected abstract getById(contactId: ILivechatContact['_id'], appId: string): Promise<ILivechatContact | undefined>;
    protected abstract verifyContact(verifyContactChannelParams: VerifyContactChannelParams, appId: string): Promise<void>;
    protected abstract addContactEmail(contactId: ILivechatContact['_id'], email: string, appId: string): Promise<ILivechatContact>;
    private hasReadPermission;
    private hasWritePermission;
}
