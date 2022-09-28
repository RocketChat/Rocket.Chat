import { ajv } from '../../ajv';

export type UserLogoutParamsPOST = {
	userId?: string;
};

const UserLogoutParamsPostSchema = {
	type: 'object',
	properties: {
		userId: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
};

export const isUserLogoutParamsPOST = ajv.compile<UserLogoutParamsPOST>(UserLogoutParamsPostSchema);
