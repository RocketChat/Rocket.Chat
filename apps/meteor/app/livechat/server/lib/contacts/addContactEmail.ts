import type { ILivechatContact } from '@rocket.chat/core-typings';
import { LivechatContacts } from '@rocket.chat/models';

/**
 * Adds a new email into the contact's email list, if the email is already in the list it does not add anything
 * and simply return the data, since the email was aready registered :P
 *
 * @param contactId the id of the contact that will be updated
 * @param email the email that will be added to the contact
 * @returns the updated contact
 */
export async function addContactEmail(contactId: ILivechatContact['_id'], email: string): Promise<ILivechatContact> {
	const contact = await LivechatContacts.findOneById(contactId);
	if (!contact) {
		throw new Error('error-contact-not-found');
	}

	const emails = contact.emails?.map(({ address }) => address) || [];
	if (!emails.includes(email)) {
		return LivechatContacts.updateContact(contactId, {
			emails: [...emails.map((e) => ({ address: e })), { address: email }],
		});
	}

	return contact;
}
