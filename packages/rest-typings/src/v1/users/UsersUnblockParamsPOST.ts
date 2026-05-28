import { ajv } from '../Ajv';

export type UsersUnblockParamsPOST = {
	rid: string;
	userId: string;
};

const UsersUnblockParamsPostSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
			minLength: 1,
		},
		userId: {
			type: 'string',
			minLength: 1,
		},
	},
	required: ['rid', 'userId'],
	additionalProperties: false,
};

export const isUsersUnblockParamsPOST = ajv.compile<UsersUnblockParamsPOST>(UsersUnblockParamsPostSchema);
