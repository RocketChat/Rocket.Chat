import type { ILivechatContact, ILivechatCustomField } from '@rocket.chat/core-typings';
import { LivechatContacts, LivechatCustomField, LivechatRooms, LivechatVisitors } from '@rocket.chat/models';

import { livechatLogger } from './logger';
import { i18n } from '../../../utils/lib/i18n';

export const validateRequiredCustomFields = (customFields: string[], livechatCustomFields: ILivechatCustomField[]) => {
	const errors: string[] = [];
	const requiredCustomFields = livechatCustomFields.filter((field) => field.required);

	requiredCustomFields.forEach((field) => {
		if (!customFields.find((f) => f === field._id)) {
			errors.push(field._id);
		}
	});

	if (errors.length > 0) {
		throw new Error(`Missing required custom fields: ${errors.join(', ')}`);
	}
};

export async function updateContactsCustomFields(
	contact: ILivechatContact,
	validCustomFields: {
		key: string;
		value: string;
		overwrite: boolean;
	}[],
): Promise<void> {
	const contactCustomFieldsToUpdate = validCustomFields.reduce(
		(prev, curr) => {
			if (curr.overwrite || !contact?.customFields?.[curr.key]) {
				prev[`customFields.${curr.key}`] = curr.value;
				return prev;
			}
			prev.conflictingFields ??= contact.conflictingFields || [];
			prev.conflictingFields.push({ field: `customFields.${curr.key}`, value: curr.value });
			return prev;
		},
		{} as Record<string, any>,
	);

	if (!Object.keys(contactCustomFieldsToUpdate).length) {
		return;
	}

	livechatLogger.debug({ msg: 'Updating custom fields for contact', contactId: contact._id, contactCustomFieldsToUpdate });
	await LivechatContacts.updateById(contact._id, { $set: contactCustomFieldsToUpdate });
}

export async function setCustomFields({
	token,
	key,
	value,
	overwrite,
}: {
	key: string;
	value: string;
	overwrite: boolean;
	token: string;
}): Promise<number> {
	livechatLogger.debug(`Setting custom fields data for visitor with token ${token}`);

	const customField = await LivechatCustomField.findOneById(key);
	if (!customField) {
		throw new Error('invalid-custom-field');
	}

	if (customField.regexp !== undefined && customField.regexp !== '') {
		const regexp = new RegExp(customField.regexp);
		if (!regexp.test(value)) {
			throw new Error(i18n.t('error-invalid-custom-field-value', { field: key }));
		}
	}

	let result;
	if (customField.scope === 'room') {
		result = await LivechatRooms.updateDataByToken(token, key, value, overwrite);
	} else {
		result = await LivechatVisitors.updateLivechatDataByToken(token, key, value, overwrite);

		const visitor = await LivechatVisitors.getVisitorByToken(token, { projection: { _id: 1 } });
		if (visitor) {
			const contacts = await LivechatContacts.findAllByVisitorId(visitor._id).toArray();
			if (contacts.length > 0) {
				await Promise.all(contacts.map((contact) => updateContactsCustomFields(contact, [{ key, value, overwrite }])));
			}
		}
	}

	if (typeof result === 'boolean') {
		// Note: this only happens when !overwrite is passed, in this case we don't do any db update
		return 0;
	}

	return result.modifiedCount;
}
