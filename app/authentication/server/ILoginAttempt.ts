import { IUser } from '../../../definition/IUser';
import { IMethodConnection } from '../../../definition/IMethodThisType';

interface IMethodArgument {
	user?: { username: string };
	password?: {
		digest: string;
		algorithm: string;
	};
	resume?: string;
}

export interface ILoginAttempt {
	type: string;
	allowed: boolean;
	methodName: string;
	methodArguments: IMethodArgument[];
	connection: IMethodConnection;
	user?: IUser;
}
