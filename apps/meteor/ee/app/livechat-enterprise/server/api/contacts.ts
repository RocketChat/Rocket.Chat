import Ajv from 'ajv';

import { API } from '../../../../../app/api/server';
import { logger } from '../lib/logger';
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
			logger.info(`Visitor with id ${visitorId} blocked by user with id ${user._id}`);

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
			const { user } = this;

			await changeContactBlockStatus({
				visitorId,
				block: false,
			});
			logger.info(`Visitor with id ${visitorId} unblocked by user with id ${user._id}`);

			return API.v1.success();
		},
	},
);
