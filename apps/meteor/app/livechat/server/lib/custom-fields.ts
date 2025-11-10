import type { ILivechatContact, ILivechatCustomField, ILivechatVisitor } from '@rocket.chat/core-typings';
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

export async function setMultipleVisitorCustomFields(
	visitor: ILivechatVisitor,
	customFields: {
		key: string;
		value: string;
		overwrite: boolean;
	}[],
	livechatCustomFields?: ILivechatCustomField[],
) {
	const keys = customFields.map((field) => field.key);

	livechatCustomFields ??= await LivechatCustomField.findByScope('visitor', { projection: { _id: 1, required: 1 } }, false).toArray();
	validateRequiredCustomFields(keys, livechatCustomFields);

	const matchingCustomFields = livechatCustomFields.filter((field: ILivechatCustomField) => keys.includes(field._id));
	const validCustomFields = customFields.filter((cf) => matchingCustomFields.find((mcf) => cf.key === mcf._id));
	if (!validCustomFields.length) {
		return false;
	}

	const visitorCustomFieldsToUpdate = validCustomFields.reduce(
		(prev, curr) => {
			if (curr.overwrite) {
				prev[`livechatData.${curr.key}`] = curr.value;
				return prev;
			}

			if (!visitor?.livechatData?.[curr.key]) {
				prev[`livechatData.${curr.key}`] = curr.value;
			}

			return prev;
		},
		{} as Record<string, string>,
	);

	if (Object.keys(visitorCustomFieldsToUpdate).length) {
		await LivechatVisitors.updateAllLivechatDataByToken(visitor.token, visitorCustomFieldsToUpdate);
	}

	const contacts = await LivechatContacts.findAllByVisitorId(visitor._id).toArray();
	if (contacts.length) {
		await Promise.all(contacts.map((contact) => updateContactsCustomFields(contact, validCustomFields)));
	}

	if (validCustomFields.length !== keys.length) {
		livechatLogger.warn({
			msg: 'Some custom fields were not processed',
			visitorId: visitor._id,
			missingKeys: keys.filter((key) => !validCustomFields.map((v) => v.key).includes(key)),
		});
	}

	return true;
}

export async function setMultipleCustomFields({
	visitor,
	customFields,
}: {
	visitor: ILivechatVisitor;
	customFields: {
		key: string;
		value: string;
		overwrite: boolean;
	}[];
}): Promise<
	{
		key: string;
		value: string;
		overwrite: boolean;
	}[]
> {
	livechatLogger.debug(`Setting custom fields data for visitor with token ${visitor.token}`);

	const keys = customFields.map((customField) => customField.key);
	const dbFields = await LivechatCustomField.find(
		{ _id: { $in: keys } },
		{ projection: { _id: 1, required: 1, regexp: 1, scope: 1 } },
	).toArray();
	if (!dbFields.length) {
		throw new Error('invalid-custom-field');
	}

	const { visitorFields, roomFields } = customFields.reduce(
		(prev, customField) => {
			const dbField = dbFields.find((customF) => customF._id === customField.key);
			if (!dbField) {
				throw new Error('invalid-custom-field');
			}

			if (dbField.regexp !== undefined && dbField.regexp !== '') {
				const regexp = new RegExp(dbField.regexp);
				if (!regexp.test(customField.value)) {
					throw new Error(i18n.t('error-invalid-custom-field-value', { field: dbField._id }));
				}
			}

			if (dbField.scope === 'visitor') {
				prev.visitorFields ??= [];
				prev.visitorFields.push(customField);
				return prev;
			}

			prev.roomFields ??= [];
			prev.roomFields.push(customField);
			return prev;
		},
		{} as {
			visitorFields: { key: string; value: string; overwrite: boolean }[];
			roomFields: { key: string; value: string; overwrite: boolean }[];
		},
	);

	if (roomFields?.length) {
		await Promise.all(roomFields.map(({ key, value, overwrite }) => LivechatRooms.updateDataByToken(visitor.token, key, value, overwrite)));
		livechatLogger.debug({ msg: 'Custom fields for room updated', visitor, roomFields });
	}

	if (visitorFields?.length) {
		await setMultipleVisitorCustomFields(
			visitor,
			visitorFields,
			dbFields.filter((field) => field.scope === 'visitor'),
		);
		livechatLogger.debug({ msg: 'Custom fields for visitor updated', visitor, visitorFields });
	}

	return [...(roomFields || []), ...(visitorFields || [])];
}
