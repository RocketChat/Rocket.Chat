import type { ITeam, IUser } from '@rocket.chat/core-typings';

export type UsersEndpoints = {
	'users.info': {
		GET: (params: { userId?: IUser['_id']; userName?: IUser['username'] }) => {
			user: IUser;
		};
	};
	'users.2fa.sendEmailCode': {
		POST: (params: { emailOrUsername: string }) => void;
	};
	'users.autocomplete': {
		GET: (params: { selector: string }) => { items: IUser[] };
	};
	'users.listTeams': {
		GET: (params: { userId: IUser['_id'] }) => { teams: Array<ITeam> };
	};
	'users.setAvatar': {
		POST: (params: { userId?: IUser['_id']; username?: IUser['username']; avatarUrl?: string }) => void;
	};
	'users.resetAvatar': {
		POST: (params: { userId?: IUser['_id']; username?: IUser['username'] }) => void;
	};
};
