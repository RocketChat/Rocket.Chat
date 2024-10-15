import { isPOSTOmnichannelBlockContactProps, isPOSTOmnichannelUnblockContactProps } from '@rocket.chat/rest-typings';

import { API } from '../../../../../app/api/server';
import { changeContactBlockStatus, closeBlockedRoom, hasSingleContactLicense } from './lib/contacts';

API.v1.addRoute(
	'omnichannel/contacts.block',
	{
		authRequired: true,
		permissionsRequired: ['block-livechat-contact'],
		validateParams: isPOSTOmnichannelBlockContactProps,
	},
	{
		async post() {
			await hasSingleContactLicense();
			const { contactId, visitorId } = this.bodyParams;

			await changeContactBlockStatus({
				contactId,
				visitorId,
				block: true,
			});

			await closeBlockedRoom(visitorId);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'omnichannel/contacts.unblock',
	{
		authRequired: true,
		permissionsRequired: ['unblock-livechat-contact'],
		validateParams: isPOSTOmnichannelUnblockContactProps,
	},
	{
		async post() {
			await hasSingleContactLicense();
			const { contactId, visitorId } = this.bodyParams;

			await changeContactBlockStatus({
				contactId,
				visitorId,

				block: false,
			});

			return API.v1.success();
		},
	},
);
