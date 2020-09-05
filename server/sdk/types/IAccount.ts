import { IServiceClass } from './ServiceClass';

export interface ILoginResult {
	uid: string;
	token: string;
	tokenExpires?: Date;
	type: 'resume' | 'password';
}

export interface IAccount extends IServiceClass {
	login({ resume, user, password }: {resume: string; user: {username: string}; password: string}): Promise<false | ILoginResult>;
}
