import type { ILivechatContact } from '../livechat';

export interface IContactRead {
    getById(contactId: ILivechatContact['_id']): Promise<ILivechatContact | null>;
}
