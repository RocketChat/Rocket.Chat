import type { ILivechatContact } from '@rocket.chat/core-typings';
import { LivechatContacts, LivechatVisitors } from '@rocket.chat/models';

import { migrateVisitorToContactId } from './migrateVisitorToContactId';

export async function getContact(contactId: ILivechatContact['_id']): Promise<ILivechatContact | null> {
	const contact = await LivechatContacts.findOneById(contactId);
	if (contact) {
		return contact;
	}

	// If the contact was not found, search for a visitor with the same ID
	const visitor = await LivechatVisitors.findOneById(contactId);
	// If there's also no visitor with that ID, then there's nothing for us to get
	if (!visitor) {
		return null;
	}

	// ContactId is actually the ID of a visitor, so let's get the contact that is linked to this visitor
	const linkedContact = await LivechatContacts.findOneByVisitorId(contactId);
	if (linkedContact) {
		return linkedContact;
	}

	// If this is the ID of a visitor and there is no contact linking to it yet, then migrate it into a contact
	const newContactId = await migrateVisitorToContactId(visitor, undefined, true);
	// If no contact was created by the migration, this visitor doesn't need a contact yet, so let's return null
	if (!newContactId) {
		return null;
	}

	// Finally, let's return the data of the migrated contact
	return LivechatContacts.findOneById(newContactId);
}
