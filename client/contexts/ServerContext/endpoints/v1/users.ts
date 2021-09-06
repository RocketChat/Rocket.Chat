import type { IUser } from '../../../../../definition/IUser';

export type UsersEndpoints = {
	'users.2fa.sendEmailCode': {
		POST: (params: { emailOrUsername: string }) => { success: boolean };
	};
	'users.autocomplete': {
		GET: (params: { selector: string }) => { items: IUser[] };
	};
};
