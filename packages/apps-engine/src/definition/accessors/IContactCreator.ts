import type { ILivechatContact } from '../livechat';

/**
 * Adds to what the workspace knows about a Livechat contact.
 *
 * Verifying a channel is what lets the workspace tie a visitor to a contact
 * it already has, rather than treating them as somebody new.
 */
export interface IContactCreator {
	verifyContact(verifyContactChannelParams: {
		contactId: string;
		field: string;
		value: string;
		visitorId: string;
		roomId: string;
	}): Promise<void>;

	addContactEmail(contactId: ILivechatContact['_id'], email: string): Promise<ILivechatContact>;
}
