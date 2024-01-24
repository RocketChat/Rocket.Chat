import { UserStatus } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UsersSetStatusParamsPOST =
	| { status: UserStatus; message?: string; userId?: string; username?: string; user?: string }
	| { status?: UserStatus; message: string; userId?: string; username?: string; user?: string };

const UsersSetStatusParamsPostSchema = {
	type: 'object',
	properties: {
		status: { type: 'string', enum: Object.values(UserStatus) },
		message: { type: 'string' },
		userId: { type: 'string', nullable: true },
		username: { type: 'string', nullable: true },
		user: { type: 'string', nullable: true },
	},
	anyOf: [{ required: ['message'] }, { required: ['status'] }],
	additionalProperties: false,
};

export const isUsersSetStatusParamsPOST = ajv.compile<UsersSetStatusParamsPOST>(UsersSetStatusParamsPostSchema);
