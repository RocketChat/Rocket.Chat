import type { ILivechatVisitor, IOmnichannelSource } from '@rocket.chat/core-typings';

import type { CreateContactParams } from './createContact';
import { getAllowedCustomFields } from './getAllowedCustomFields';
import { getContactManagerIdByUsername } from './getContactManagerIdByUsername';
import { validateCustomFields } from './validateCustomFields';

export async function mapVisitorToContact(visitor: ILivechatVisitor, source: IOmnichannelSource): Promise<CreateContactParams> {
	return {
		name: visitor.name || visitor.username,
		emails: visitor.visitorEmails?.map(({ address }) => address),
		phones: visitor.phone?.map(({ phoneNumber }) => phoneNumber),
		unknown: !visitor.activity || visitor.activity.length === 0,
		channels: [
			{
				name: source.label || source.type.toString(),
				visitor: {
					visitorId: visitor._id,
					source: {
						type: source.type,
						...(source.id ? { id: source.id } : {}),
					},
				},
				blocked: false,
				verified: false,
				details: source,
				lastChat: visitor.lastChat,
			},
		],
		customFields:
			visitor.livechatData &&
			validateCustomFields(await getAllowedCustomFields(), visitor.livechatData, {
				ignoreAdditionalFields: true,
				ignoreValidationErrors: true,
			}),
		shouldValidateCustomFields: false,
		lastChat: visitor.lastChat,
		contactManager: visitor.contactManager?.username && (await getContactManagerIdByUsername(visitor.contactManager.username)),
	};
}
