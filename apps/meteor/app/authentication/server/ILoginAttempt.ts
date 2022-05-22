import type { IUser, IMethodConnection } from '@rocket.chat/core-typings';

interface IMethodArgument {
	user?: { username: string };
	password?: {
		digest: string;
		algorithm: string;
	};
	resume?: string;

	cas?: boolean;

	totp?: {
		code: string;
	};
}

export interface ILoginAttempt {
	type: string;
	allowed: boolean;
	methodName: string;
	methodArguments: IMethodArgument[];
	connection: IMethodConnection;
	user?: IUser;
}
