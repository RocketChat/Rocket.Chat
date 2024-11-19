import type { ILivechatContact, ILivechatContactChannel } from '@rocket.chat/core-typings';
import { LivechatContacts, LivechatRooms } from '@rocket.chat/models';

import { getAllowedCustomFields } from './getAllowedCustomFields';
import { validateContactManager } from './validateContactManager';
import { validateCustomFields } from './validateCustomFields';

export type UpdateContactParams = {
	contactId: string;
	name?: string;
	emails?: string[];
	phones?: string[];
	customFields?: Record<string, unknown>;
	contactManager?: string;
	channels?: ILivechatContactChannel[];
	wipeConflicts?: boolean;
};

export async function updateContact(params: UpdateContactParams): Promise<ILivechatContact> {
	const { contactId, name, emails, phones, customFields: receivedCustomFields, contactManager, channels, wipeConflicts } = params;

	const contact = await LivechatContacts.findOneById<Pick<ILivechatContact, '_id' | 'name'>>(contactId, {
		projection: { _id: 1, name: 1 },
	});

	if (!contact) {
		throw new Error('error-contact-not-found');
	}

	if (contactManager) {
		await validateContactManager(contactManager);
	}

	const customFields = receivedCustomFields && validateCustomFields(await getAllowedCustomFields(), receivedCustomFields);

	const updatedContact = await LivechatContacts.updateContact(contactId, {
		name,
		emails: emails?.map((address) => ({ address })),
		phones: phones?.map((phoneNumber) => ({ phoneNumber })),
		contactManager,
		channels,
		customFields,
		...(wipeConflicts && { conflictingFields: [] }),
	});

	// If the contact name changed, update the name of its existing rooms
	if (name !== undefined && name !== contact.name) {
		await LivechatRooms.updateContactDataByContactId(contactId, { name });
	}

	return updatedContact;
}
