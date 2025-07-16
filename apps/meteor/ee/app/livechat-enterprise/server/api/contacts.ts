import type { ILivechatContactVisitorAssociation } from '@rocket.chat/core-typings';
import { ContactVisitorAssociationSchema } from '@rocket.chat/rest-typings';
import Ajv from 'ajv';

import { API } from '../../../../../app/api/server';
import { logger } from '../lib/logger';
import { changeContactBlockStatus, closeBlockedRoom, ensureSingleContactLicense } from './lib/contacts';

const ajv = new Ajv({
	coerceTypes: true,
});

type blockContactProps = {
	visitor: ILivechatContactVisitorAssociation;
};

const blockContactSchema = {
	type: 'object',
	properties: {
		visitor: ContactVisitorAssociationSchema,
	},
	required: ['visitor'],
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
		license: ['livechat-enterprise'],
	},
	{
		async post() {
			ensureSingleContactLicense();
			const { visitor } = this.bodyParams;
			const { user } = this;

			await changeContactBlockStatus({
				visitor,
				block: true,
			});
			logger.info(`Visitor with id ${visitor.visitorId} blocked by user with id ${user._id}`);

			await closeBlockedRoom(visitor, user);

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
		license: ['livechat-enterprise'],
	},
	{
		async post() {
			ensureSingleContactLicense();
			const { visitor } = this.bodyParams;
			const { user } = this;

			await changeContactBlockStatus({
				visitor,
				block: false,
			});
			logger.info(`Visitor with id ${visitor.visitorId} unblocked by user with id ${user._id}`);

			return API.v1.success();
		},
	},
);
