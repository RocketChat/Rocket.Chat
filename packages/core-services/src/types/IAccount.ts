import type { IServiceClass } from './ServiceClass';

export interface ILoginResult {
	uid: string;
	token: string;
	hashedToken: string;
	tokenExpires?: Date;
	type: 'resume';
}

export interface IAccount extends IServiceClass {
	login({ resume }: { resume: string }): Promise<false | ILoginResult>;
	logout({ userId, token }: { userId: string; token: string }): Promise<void>;
}
