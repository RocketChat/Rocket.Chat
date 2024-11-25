import type { ILivechatContactChannel, IVisitorLastChat } from '@rocket.chat/core-typings';
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
	lastChat?: IVisitorLastChat;
	contactManager?: string;
	channels?: ILivechatContactChannel[];
	importIds?: string[];
};

export async function createContact({
	name,
	emails,
	phones,
	customFields: receivedCustomFields = {},
	lastChat,
	contactManager,
	channels = [],
	unknown,
	importIds,
}: CreateContactParams): Promise<string> {
	if (contactManager) {
		await validateContactManager(contactManager);
	}

	const allowedCustomFields = await getAllowedCustomFields();
	const customFields = validateCustomFields(allowedCustomFields, receivedCustomFields);

	return LivechatContacts.insertContact({
		name,
		emails: emails?.map((address) => ({ address })),
		phones: phones?.map((phoneNumber) => ({ phoneNumber })),
		contactManager,
		channels,
		customFields,
		lastChat,
		unknown,
		...(importIds?.length && { importIds }),
	});
}
