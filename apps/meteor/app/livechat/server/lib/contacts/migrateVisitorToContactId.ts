import type { ILivechatVisitor, IOmnichannelSource, ILivechatContact, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatContacts, LivechatRooms } from '@rocket.chat/models';

import { livechatContactsLogger as logger } from '../logger';
import { ContactMerger } from './ContactMerger';
import { createContactFromVisitor } from './createContactFromVisitor';

/**
	This function assumes you already ensured that the visitor is not yet linked to any contact
**/
export async function migrateVisitorToContactId({
	visitor,
	source,
	requireRoom = true,
}: {
	visitor: ILivechatVisitor;
	source: IOmnichannelSource;
	requireRoom?: boolean;
}): Promise<ILivechatContact['_id'] | null> {
	if (requireRoom) {
		// Do not migrate the visitor with this source if they have no rooms matching it
		const anyRoom = await LivechatRooms.findNewestByContactVisitorAssociation<Pick<IOmnichannelRoom, '_id'>>(
			{ visitorId: visitor._id, source },
			{
				projection: { _id: 1 },
			},
		);

		if (!anyRoom) {
			return null;
		}
	}

	// Search for any contact that is not yet associated with any visitor and that have the same email or phone number as this visitor.
	const existingContact = await LivechatContacts.findContactMatchingVisitor(visitor);
	if (!existingContact) {
		logger.debug(`Creating a new contact for existing visitor ${visitor._id}`);
		return createContactFromVisitor(visitor, source);
	}

	// There is already an existing contact with no linked visitors and matching this visitor's phone or email, so let's use it
	logger.debug(`Adding channel to existing contact ${existingContact._id}`);
	await ContactMerger.mergeVisitorIntoContact(visitor, existingContact, source);

	// Update all existing rooms matching the visitor id and source to set the contactId to them
	await LivechatRooms.setContactByVisitorAssociation(
		{
			visitorId: visitor._id,
			source,
		},
		existingContact,
	);

	return existingContact._id;
}
