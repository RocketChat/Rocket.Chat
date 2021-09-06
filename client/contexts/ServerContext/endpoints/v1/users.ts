import type { IUser } from '../../../../../definition/IUser';

export type UsersEndpoints = {
	'users.2fa.sendEmailCode': {
		POST: (payload: { emailOrUsername: string }) => void;
	};
	'users.autocomplete': {
		GET: (params: { selector: string }) => { items: IUser[] };
	};
};
