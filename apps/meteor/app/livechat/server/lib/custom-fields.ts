import type { ILivechatContact, ILivechatCustomField } from '@rocket.chat/core-typings';
import { LivechatContacts, LivechatCustomField, LivechatRooms, LivechatVisitors } from '@rocket.chat/models';
import type { UpdateFilter } from 'mongodb';

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
	// contact: ILivechatContact,
	visitorId: string,
	key: string,
	value: string,
	overwrite: boolean,
): Promise<void> {
	const queryUpdates: UpdateFilter<ILivechatContact> = {};

	if (overwrite) {
		// contact.customFields ??= {};
		// contact.customFields[key] = value;
		queryUpdates.$set = { [`customFields.${key}`]: value };
	} else {
		// contact.conflictingFields ??= [];
		// contact.conflictingFields.push({ field: `customFields.${key}`, value });
		queryUpdates.$addToSet = { conflictingFields: { field: `customFields.${key}`, value } };
	}

	// await LivechatContacts.updateById(contact._id, {
	// 	$set: { customFields: contact.customFields, conflictingFields: contact.conflictingFields },
	// });

	await LivechatContacts.updateByVisitorId(visitorId, queryUpdates);

	livechatLogger.debug({ msg: 'Contacts updated', visitorId });
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
}): Promise<void> {
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

	if (customField.scope === 'room') {
		await LivechatRooms.updateDataByToken(token, key, value, overwrite);
	} else {
		await LivechatVisitors.updateLivechatDataByToken(token, key, value, overwrite);

		const visitor = await LivechatVisitors.getVisitorByToken(token, { projection: { _id: 1 } });
		if (!visitor) {
			throw new Error(`Visitor with token "${token}" not found.`);
		}

		// const result = await LivechatContacts.findAllByVisitorId(visitor._id).toArray();
		// if (result) {
		// 	await Promise.all(result.map((contact: ILivechatContact) => updateContactsCustomFields(contact, key, value, overwrite)));
		// }

		await updateContactsCustomFields(visitor._id, key, value, overwrite);
	}
}
