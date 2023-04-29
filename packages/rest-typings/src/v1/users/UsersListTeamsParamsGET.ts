import type { IUser } from '@rocket.chat/core-typings';

import { ajv } from '../../helpers/schemas';

export type UsersListTeamsParamsGET = { userId: IUser['_id'] };

const UsersListTeamsParamsGetSchema = {
	type: 'object',
	properties: {
		userId: {
			type: 'string',
		},
	},
	required: ['userId'],
	additionalProperties: false,
};

export const isUsersListTeamsProps = ajv.compile<UsersListTeamsParamsGET>(UsersListTeamsParamsGetSchema);
