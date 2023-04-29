import { ajv } from '../../helpers/schemas';

export type UserSetActiveStatusParamsPOST = {
	userId: string;
	activeStatus: boolean;
	confirmRelinquish?: boolean;
};

const UserCreateParamsPostSchema = {
	type: 'object',
	properties: {
		userId: { type: 'string' },
		activeStatus: { type: 'boolean' },
		confirmRelinquish: { type: 'boolean', nullable: true },
	},
	required: ['userId', 'activeStatus'],
	additionalProperties: false,
};

export const isUserSetActiveStatusParamsPOST = ajv.compile<UserSetActiveStatusParamsPOST>(UserCreateParamsPostSchema);
