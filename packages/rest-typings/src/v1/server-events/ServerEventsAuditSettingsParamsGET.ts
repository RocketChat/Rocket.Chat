import type { IAuditServerActor } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ServerEventsAuditSettingsParamsGET = PaginatedRequest<{
	start?: string;
	end?: string;
	settingId?: string;
	actor?: IAuditServerActor;
}>;

const ServerEventsAuditSettingsParamsGetSchema = {
	type: 'object',
	properties: {
		sort: {
			type: 'object',
			nullable: true,
			properties: {
				ts: {
					type: 'number',
					nullable: true,
				},
			},
		},
		count: {
			type: 'number',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		start: {
			type: 'string',
			nullable: true,
		},
		end: {
			type: 'string',
			nullable: true,
		},
		settingId: {
			type: 'string',
			nullable: true,
		},
		actor: {
			type: 'object',
			nullable: true,
			properties: {
				type: {
					type: 'string',
					nullable: true,
				},
				_id: {
					type: 'string',
					nullable: true,
				},
				username: {
					type: 'string',
					nullable: true,
				},
				ip: {
					type: 'string',
					nullable: true,
				},
				useragent: {
					type: 'string',
					nullable: true,
				},
				reason: {
					type: 'string',
					nullable: true,
				},
			},
		},
	},
	additionalProperties: false,
};

export const isServerEventsAuditSettingsProps = ajv.compile<ServerEventsAuditSettingsParamsGET>(ServerEventsAuditSettingsParamsGetSchema);
