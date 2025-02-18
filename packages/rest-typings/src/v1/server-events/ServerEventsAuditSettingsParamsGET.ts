import Ajv from 'ajv';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ServerEventsAuditSettingsParamsGET = PaginatedRequest<{
	start?: string;
	end?: string;
	filter?: string;
	// filter?: Serialized<{ actor?: Partial<IAuditServerActor>; settingId?: string }>;
}>;

const ServerEventsAuditSettingsParamsGetSchema = {
	type: 'object',
	properties: {
		sort: {
			type: 'string',
			nullable: true,
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
		filter: {
			type: 'string',
			nullable: true,
		},
		// not sure we can type this since filter is sent as JSON
		// actor: {
		// 	type: 'object',
		// 	nullable: true,
		// 	properties: {
		// 		type: {
		// 			type: 'string',
		// 			nullable: true,
		// 		},
		// 		_id: {
		// 			type: 'string',
		// 			nullable: true,
		// 		},
		// 		username: {
		// 			type: 'string',
		// 			nullable: true,
		// 		},
		// 		ip: {
		// 			type: 'string',
		// 			nullable: true,
		// 		},
		// 		useragent: {
		// 			type: 'string',
		// 			nullable: true,
		// 		},
		// 		reason: {
		// 			type: 'string',
		// 			nullable: true,
		// 		},
		// 	},
		// },
		// settingId: {
		// 	type: 'string',
		// 	nullable: true,
		// },
	},

	additionalProperties: false,
};

export const isServerEventsAuditSettingsProps = ajv.compile<ServerEventsAuditSettingsParamsGET>(ServerEventsAuditSettingsParamsGetSchema);
