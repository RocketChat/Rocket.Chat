import { ajv } from '../../helpers/schemas';

export type UserSetAvatarParamsPOST = {
	avatarUrl?: string;
	userId?: string;
	username?: string;
};

const UserSetAvatarParamsPostSchema = {
	type: 'object',
	properties: {
		avatarUrl: {
			type: 'string',
			nullable: true,
		},
		userId: {
			type: 'string',
			nullable: true,
		},
		username: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isUserSetAvatarParamsPOST = ajv.compile<UserSetAvatarParamsPOST>(UserSetAvatarParamsPostSchema);
