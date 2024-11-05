import type { ILivechatVisitor, IOmnichannelSource } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';

import { createContact } from './createContact';
import { mapVisitorToContact } from './mapVisitorToContact';

export async function createContactFromVisitor(
	visitor: ILivechatVisitor,
	source: IOmnichannelSource,
	useVisitorId = false,
): Promise<string> {
	const contactData = await mapVisitorToContact(visitor, source);

	const contactId = await createContact(contactData, useVisitorId ? visitor._id : undefined);

	await LivechatRooms.setContactByVisitorAssociation(
		{
			visitorId: visitor._id,
			source: { type: source.type, ...(source.id ? { id: source.id } : {}) },
		},
		{
			_id: contactId,
			name: contactData.name,
		},
	);

	return contactId;
}
