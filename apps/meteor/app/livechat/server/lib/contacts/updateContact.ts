import type { ILivechatContact, ILivechatContactChannel } from '@rocket.chat/core-typings';
import { LivechatContacts, LivechatInquiry, LivechatRooms, Settings, Subscriptions } from '@rocket.chat/models';

import { getAllowedCustomFields } from './getAllowedCustomFields';
import { validateContactManager } from './validateContactManager';
import { validateCustomFields } from './validateCustomFields';
import {
	notifyOnSubscriptionChangedByVisitorIds,
	notifyOnRoomChangedByContactId,
	notifyOnLivechatInquiryChangedByVisitorIds,
	notifyOnSettingChanged,
} from '../../../../lib/server/lib/notifyListener';

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

	const contact = await LivechatContacts.findOneById<Pick<ILivechatContact, '_id' | 'name' | 'customFields' | 'conflictingFields'>>(
		contactId,
		{
			projection: { _id: 1, name: 1, customFields: 1, conflictingFields: 1 },
		},
	);

	if (!contact) {
		throw new Error('error-contact-not-found');
	}

	if (contactManager) {
		await validateContactManager(contactManager);
	}

	if (wipeConflicts && contact.conflictingFields?.length) {
		const value = await Settings.incrementValueById('Resolved_Conflicts_Count', contact.conflictingFields.length, {
			returnDocument: 'after',
		});
		if (value) {
			void notifyOnSettingChanged(value);
		}
	}

	const workspaceAllowedCustomFields = await getAllowedCustomFields();
	const workspaceAllowedCustomFieldsIds = workspaceAllowedCustomFields.map((customField) => customField._id);
	const currentCustomFieldsIds = Object.keys(contact.customFields || {});
	const notRegisteredCustomFields = currentCustomFieldsIds
		.filter((customFieldId) => !workspaceAllowedCustomFieldsIds.includes(customFieldId))
		.map((customFieldId) => ({ _id: customFieldId }));

	const customFieldsToUpdate =
		receivedCustomFields &&
		validateCustomFields(workspaceAllowedCustomFields, receivedCustomFields, {
			ignoreAdditionalFields: !!notRegisteredCustomFields.length,
		});

	if (receivedCustomFields && customFieldsToUpdate && notRegisteredCustomFields.length) {
		const allowedCustomFields = [...workspaceAllowedCustomFields, ...notRegisteredCustomFields];
		validateCustomFields(allowedCustomFields, receivedCustomFields);

		notRegisteredCustomFields.forEach((notRegisteredCustomField) => {
			customFieldsToUpdate[notRegisteredCustomField._id] = contact.customFields?.[notRegisteredCustomField._id] as string;
		});
	}

	const updatedContact = await LivechatContacts.updateContact(contactId, {
		name,
		...(emails && { emails: emails?.map((address) => ({ address })) }),
		...(phones && { phones: phones?.map((phoneNumber) => ({ phoneNumber })) }),
		...(contactManager && { contactManager }),
		...(channels && { channels }),
		...(customFieldsToUpdate && { customFields: customFieldsToUpdate }),
		...(wipeConflicts && { conflictingFields: [] }),
	});

	// If the contact name changed, update the name of its existing rooms and subscriptions
	if (name !== undefined && name !== contact.name) {
		await LivechatRooms.updateContactDataByContactId(contactId, { name });
		void notifyOnRoomChangedByContactId(contactId);

		const visitorIds = updatedContact.channels?.map((channel) => channel.visitor.visitorId);
		if (visitorIds?.length) {
			await Subscriptions.updateNameAndFnameByVisitorIds(visitorIds, name);
			void notifyOnSubscriptionChangedByVisitorIds(visitorIds);

			await LivechatInquiry.updateNameByVisitorIds(visitorIds, name);
			void notifyOnLivechatInquiryChangedByVisitorIds(visitorIds, 'updated', { name });
		}
	}

	return updatedContact;
}
