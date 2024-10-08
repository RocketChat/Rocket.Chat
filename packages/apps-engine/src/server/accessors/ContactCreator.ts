import type { IContactCreator } from '../../definition/accessors/IContactCreator';
import type { AppBridges } from '../bridges';

export class ContactCreator implements IContactCreator {
    constructor(private readonly bridges: AppBridges, private readonly appId: string) {}

    verifyContact(verifyContactChannelParams: {
        contactId: string;
        field: string;
        value: string;
        channelName: string;
        visitorId: string;
        roomId: string;
    }): Promise<void> {
        return this.bridges.getContactBridge().doVerifyContact(verifyContactChannelParams, this.appId);
    }
}
