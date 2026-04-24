import { ajvQuery } from '../Ajv';

type UsersPresenceParamsGET = {
	from?: string;
	ids?: string | string[];
};

const UsersPresenceParamsGetSchema = {
	type: 'object',
	properties: {
		from: { type: 'string', nullable: true },
		ids: {
			anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
		},
	},
	additionalProperties: false,
};

export const isUsersPresenceParamsGET = ajvQuery.compile<UsersPresenceParamsGET>(UsersPresenceParamsGetSchema);
