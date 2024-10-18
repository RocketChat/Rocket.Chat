import Ajv from 'ajv';

import { API } from '../../../../../app/api/server';
import { changeContactBlockStatus, closeBlockedRoom, ensureSingleContactLicense } from './lib/contacts';

const ajv = new Ajv({
	coerceTypes: true,
});

type blockContactProps = {
	visitorId: string;
};

const blockContactSchema = {
	type: 'object',
	properties: {
		visitorId: {
			type: 'string',
		},
	},
	required: ['visitorId'],
	additionalProperties: false,
};

const isBlockContactProps = ajv.compile<blockContactProps>(blockContactSchema);

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/omnichannel/contacts.block': {
			POST: (params: blockContactProps) => void;
		};
		'/v1/omnichannel/contacts.unblock': {
			POST: (params: blockContactProps) => void;
		};
	}
}

API.v1.addRoute(
	'omnichannel/contacts.block',
	{
		authRequired: true,
		permissionsRequired: ['block-livechat-contact'],
		validateParams: isBlockContactProps,
	},
	{
		async post() {
			ensureSingleContactLicense();
			const { visitorId } = this.bodyParams;
			const { user } = this;

			await changeContactBlockStatus({
				visitorId,
				block: true,
			});

			await closeBlockedRoom(visitorId, user);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'omnichannel/contacts.unblock',
	{
		authRequired: true,
		permissionsRequired: ['unblock-livechat-contact'],
		validateParams: isBlockContactProps,
	},
	{
		async post() {
			ensureSingleContactLicense();
			const { visitorId } = this.bodyParams;

			await changeContactBlockStatus({
				visitorId,
				block: false,
			});

			return API.v1.success();
		},
	},
);
