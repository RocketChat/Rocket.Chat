import type { ILivechatContact } from '../livechat';

export interface IContactRead {
    getById(id: ILivechatContact['_id']): Promise<ILivechatContact | null>;
}
