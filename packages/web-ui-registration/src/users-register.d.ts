import type { IUser } from '@rocket.chat/core-typings';

declare module '@rocket.chat/rest-typings' {
	interface Endpoints {
		'/v1/users.register': {
			POST: (params: {
				username: string;
				name?: string;
				email: string;
				pass: string;
				secret?: string;
				reason?: string;
				customFields?: object;
			}) => {
				user: IUser;
			};
		};
	}
}
