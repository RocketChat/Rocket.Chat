import type { IContactCreator } from '../../definition/accessors/IContactCreator';
import type { ILivechatContact } from '../../definition/livechat';
import type { AppBridges } from '../bridges';

export class ContactCreator implements IContactCreator {
    constructor(
        private readonly bridges: AppBridges,
        private readonly appId: string,
    ) {}

    verifyContact(verifyContactChannelParams: { contactId: string; field: string; value: string; visitorId: string; roomId: string }): Promise<void> {
        return this.bridges.getContactBridge().doVerifyContact(verifyContactChannelParams, this.appId);
    }

    addContactEmail(contactId: ILivechatContact['_id'], email: string): Promise<ILivechatContact> {
        return this.bridges.getContactBridge().doAddContactEmail(contactId, email, this.appId);
    }
}
