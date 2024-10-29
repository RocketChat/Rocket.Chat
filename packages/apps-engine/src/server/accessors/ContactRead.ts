import type { IContactRead } from '../../definition/accessors/IContactRead';
import type { ILivechatContact, IVisitor } from '../../definition/livechat';
import type { AppBridges } from '../bridges';

export class ContactRead implements IContactRead {
    constructor(
        private readonly bridges: AppBridges,
        private readonly appId: string,
    ) {}

    public getByVisitorId(visitorId: IVisitor['id']): Promise<ILivechatContact | null> {
        return this.bridges.getContactBridge().doGetByVisitorId(visitorId, this.appId);
    }
}
