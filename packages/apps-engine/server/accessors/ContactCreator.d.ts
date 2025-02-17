import type { IContactCreator } from '../../definition/accessors/IContactCreator';
import type { ILivechatContact } from '../../definition/livechat';
import type { AppBridges } from '../bridges';
export declare class ContactCreator implements IContactCreator {
    private readonly bridges;
    private readonly appId;
    constructor(bridges: AppBridges, appId: string);
    verifyContact(verifyContactChannelParams: {
        contactId: string;
        field: string;
        value: string;
        visitorId: string;
        roomId: string;
    }): Promise<void>;
    addContactEmail(contactId: ILivechatContact['_id'], email: string): Promise<ILivechatContact>;
}
