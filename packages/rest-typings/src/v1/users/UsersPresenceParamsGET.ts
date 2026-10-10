import { ajvQuery } from '../Ajv';

type UsersPresenceParamsGET = {
	from?: string;
	ids?: string | string[];
	offset?: number;
	count?: number;
};

const UsersPresenceParamsGetSchema = {
	type: 'object',
	properties: {
		from: { type: 'string', nullable: true },
		ids: {
			type: ['string', 'array'],
			items: { type: 'string' },
		},
		offset: { type: 'number', nullable: true },
		count: { type: 'number', nullable: true },
	},
	additionalProperties: false,
};

export const isUsersPresenceParamsGET = ajvQuery.compile<UsersPresenceParamsGET>(UsersPresenceParamsGetSchema);
