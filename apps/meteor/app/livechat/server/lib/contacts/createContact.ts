import type { ILivechatContact, ILivechatContactChannel } from '@rocket.chat/core-typings';
import { LivechatContacts } from '@rocket.chat/models';

import { getAllowedCustomFields } from './getAllowedCustomFields';
import { validateContactManager } from './validateContactManager';
import { validateCustomFields } from './validateCustomFields';

export type CreateContactParams = {
	name: string;
	emails?: string[];
	phones?: string[];
	unknown: boolean;
	customFields?: Record<string, string | unknown>;
	contactManager?: string;
	channels?: ILivechatContactChannel[];
	importIds?: string[];
};

export async function createContact(params: CreateContactParams, upsertId?: ILivechatContact['_id']): Promise<string> {
	const { name, emails, phones, customFields: receivedCustomFields = {}, contactManager, channels, unknown, importIds } = params;

	if (contactManager) {
		await validateContactManager(contactManager);
	}

	const allowedCustomFields = await getAllowedCustomFields();
	const customFields = validateCustomFields(allowedCustomFields, receivedCustomFields);

	const updateData = {
		name,
		emails: emails?.map((address) => ({ address })),
		phones: phones?.map((phoneNumber) => ({ phoneNumber })),
		contactManager,
		channels,
		customFields,
		unknown,
		...(importIds?.length ? { importIds } : {}),
	} as const;

	// Use upsert when doing auto-migration so that if there's multiple requests processing at the same time, they won't interfere with each other
	if (upsertId) {
		await LivechatContacts.upsertContact(upsertId, updateData);
		return upsertId;
	}

	return LivechatContacts.insertContact(updateData);
}
