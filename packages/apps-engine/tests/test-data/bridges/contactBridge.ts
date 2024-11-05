import type { IContactVerificationAppProvider } from '../../../src/definition/contacts/IContactVerificationAppProvider';
import type { ILivechatContact, IVisitor } from '../../../src/definition/livechat';
import { ContactBridge } from '../../../src/server/bridges';

export class TestContactBridge extends ContactBridge {
    protected registerProvider(info: IContactVerificationAppProvider, appId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    protected unregisterProvider(info: IContactVerificationAppProvider): Promise<void> {
        throw new Error('Method not implemented.');
    }

    protected addContactEmail(contactId: ILivechatContact['_id'], email: string, appId: string): Promise<ILivechatContact> {
        throw new Error('Method not implemented.');
    }

    protected getByVisitorId(id: IVisitor['id']): Promise<ILivechatContact> {
        throw new Error('Method not implemented.');
    }

    protected verifyContact(verifyContactChannelParams: { contactId: string; field: string; value: string; visitorId: string; roomId: string }): Promise<void> {
        throw new Error('Method not implemented.');
    }
}
