import type { ILivechatContact, IVisitor } from '../livechat';

export interface IContactRead {
    getByVisitorId(visitorId: IVisitor['id']): Promise<ILivechatContact | null>;
}
