import type { IContactRead } from '../../definition/accessors/IContactRead';
import type { ILivechatContact } from '../../definition/livechat';
import type { AppBridges } from '../bridges';
export declare class ContactRead implements IContactRead {
    private readonly bridges;
    private readonly appId;
    constructor(bridges: AppBridges, appId: string);
    getById(contactId: ILivechatContact['_id']): Promise<ILivechatContact | undefined>;
}
