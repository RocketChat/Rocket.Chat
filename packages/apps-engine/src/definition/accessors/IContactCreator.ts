import type { ILivechatContact } from '../livechat';

export interface IContactCreator {
    verifyContact(verifyContactChannelParams: { contactId: string; field: string; value: string; visitorId: string; roomId: string }): Promise<void>;

    addContactEmail(contactId: ILivechatContact['_id'], email: string): Promise<ILivechatContact>;
}
