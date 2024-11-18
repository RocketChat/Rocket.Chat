import type { ILivechatContact, ILivechatContactVisitorAssociation } from '@rocket.chat/core-typings';
import { LivechatContacts, LivechatVisitors } from '@rocket.chat/models';

import { migrateVisitorToContactId } from './migrateVisitorToContactId';

export async function getContactByChannel(association: ILivechatContactVisitorAssociation): Promise<ILivechatContact | null> {
	// If a contact already exists for that visitor, return it
	const linkedContact = await LivechatContacts.findOneByVisitor(association);
	if (linkedContact) {
		return linkedContact;
	}

	// If the contact was not found, Load the visitor data so we can migrate it
	const visitor = await LivechatVisitors.findOneById(association.visitorId);

	// If there is no visitor data, there's nothing we can do
	if (!visitor) {
		return null;
	}

	const newContactId = await migrateVisitorToContactId({ visitor, source: association.source });

	// If no contact was created by the migration, this visitor doesn't need a contact yet, so let's return null
	if (!newContactId) {
		return null;
	}

	// Finally, let's return the data of the migrated contact
	return LivechatContacts.findOneById(newContactId);
}
