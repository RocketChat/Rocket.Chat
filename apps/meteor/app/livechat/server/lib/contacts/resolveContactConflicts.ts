import type { ILivechatContact } from '@rocket.chat/core-typings';
import { LivechatContacts, Settings } from '@rocket.chat/models';

import { notifyOnSettingChanged } from '../../../../lib/server/lib/notifyListener';

export type ResolveContactConflictsParams = {
	contactId: string;
	customFields: Record<string, unknown>;
	wipeConflicts?: boolean;
};

export async function resolveContactConflicts(params: ResolveContactConflictsParams): Promise<ILivechatContact> {
	const { contactId, customFields, wipeConflicts } = params;

	const contact = await LivechatContacts.findOneById<Pick<ILivechatContact, '_id' | 'customFields' | 'conflictingFields'>>(contactId, {
		projection: { _id: 1, customFields: 1, conflictingFields: 1 },
	});

	if (!contact) {
		throw new Error('error-contact-not-found');
	}

	if (wipeConflicts && contact.conflictingFields?.length) {
		const value = await Settings.incrementValueById('Resolved_Conflicts_Count', contact.conflictingFields.length, {
			returnDocument: 'after',
		});
		if (value) {
			void notifyOnSettingChanged(value);
		}
	}

	if (contact.conflictingFields && !wipeConflicts) {
		contact.conflictingFields = contact.conflictingFields.filter((item) => item.field !== `customFields.${Object.keys(customFields)[0]}`);
	}

	Object.assign(contact, {
		customFields: { ...contact.customFields, ...customFields },
		...(wipeConflicts && { conflictingFields: [] }),
	});

	return LivechatContacts.updateContact(contactId, contact);
}
