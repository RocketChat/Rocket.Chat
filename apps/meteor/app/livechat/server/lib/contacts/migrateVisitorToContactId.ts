import type { ILivechatVisitor, IOmnichannelSource, ILivechatContact } from '@rocket.chat/core-typings';
import { LivechatContacts, LivechatRooms } from '@rocket.chat/models';

import { Livechat } from '../LivechatTyped';
import { ContactMerger } from './ContactMerger';
import { createContactFromVisitor } from './createContactFromVisitor';
import { getVisitorNewestSource } from './getVisitorNewestSource';

/**
	This function assumes you already ensured that the visitor is not yet linked to any contact
**/
export async function migrateVisitorToContactId(
	visitor: ILivechatVisitor,
	source?: IOmnichannelSource,
	useVisitorId = false,
): Promise<ILivechatContact['_id'] | null> {
	// If we haven't received any source and the visitor doesn't have any room yet, then there's no need to migrate it
	const visitorSource = source || (await getVisitorNewestSource(visitor));
	if (!visitorSource) {
		return null;
	}

	// Search for any contact that is not yet associated with any visitor and that have the same email or phone number as this visitor.
	const existingContact = await LivechatContacts.findContactMatchingVisitor(visitor);
	if (!existingContact) {
		Livechat.logger.debug(`Creating a new contact for existing visitor ${visitor._id}`);
		return createContactFromVisitor(visitor, visitorSource, useVisitorId);
	}

	// There is already an existing contact with no linked visitors and matching this visitor's phone or email, so let's use it
	Livechat.logger.debug(`Adding channel to existing contact ${existingContact._id}`);
	await ContactMerger.mergeVisitorIntoContact(visitor, existingContact);

	// Update all existing rooms of that visitor to add the contactId to them
	await LivechatRooms.setContactIdByVisitorIdOrToken(existingContact._id, visitor._id, visitor.token);

	return existingContact._id;
}
