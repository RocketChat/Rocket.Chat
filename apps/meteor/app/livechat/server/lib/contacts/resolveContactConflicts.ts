import type { ILivechatContact, ILivechatContactConflictingField } from '@rocket.chat/core-typings';
import { LivechatContacts, Settings } from '@rocket.chat/models';

import { validateContactManager } from './validateContactManager';
import { notifyOnSettingChanged } from '../../../../lib/server/lib/notifyListener';

export type ResolveContactConflictsParams = {
	contactId: string;
	name?: string;
	customFields?: Record<string, unknown>;
	contactManager?: string;
	wipeConflicts?: boolean;
};

export async function resolveContactConflicts(params: ResolveContactConflictsParams): Promise<ILivechatContact> {
	const { contactId, name, customFields, contactManager, wipeConflicts } = params;

	const contact = await LivechatContacts.findOneById<Pick<ILivechatContact, '_id' | 'customFields' | 'conflictingFields'>>(contactId, {
		projection: { _id: 1, customFields: 1, conflictingFields: 1 },
	});

	if (!contact) {
		throw new Error('error-contact-not-found');
	}

	if (!contact.conflictingFields?.length) {
		throw new Error('error-contact-has-no-conflicts');
	}

	if (contactManager) {
		await validateContactManager(contactManager);
	}

	let updatedConflictingFieldsArr: ILivechatContactConflictingField[] = [];
	if (wipeConflicts) {
		const value = await Settings.incrementValueById('Resolved_Conflicts_Count', contact.conflictingFields.length, {
			returnDocument: 'after',
		});
		if (value) {
			void notifyOnSettingChanged(value);
		}
	} else {
		const fieldsToRemove = new Set<string>(
			[
				name && 'name',
				contactManager && 'manager',
				...(customFields ? Object.keys(customFields).map((key) => `customFields.${key}`) : []),
			].filter((field): field is string => !!field),
		);

		updatedConflictingFieldsArr = contact.conflictingFields.filter(
			(conflictingField: ILivechatContactConflictingField) => !fieldsToRemove.has(conflictingField.field),
		) as ILivechatContactConflictingField[];
	}

	const dataToUpdate = {
		...(name && { name }),
		...(contactManager && { contactManager }),
		...(customFields && { customFields: { ...contact.customFields, ...customFields } }),
		conflictingFields: updatedConflictingFieldsArr,
	};

	return LivechatContacts.updateContact(contactId, dataToUpdate);
}
