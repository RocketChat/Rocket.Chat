import type { ITeam, IUser } from '@rocket.chat/core-typings';

type UsersPresencePayload = {
	users: UserPresence[];
	full: boolean;
};

export type UserPresence = Readonly<
	Partial<Pick<IUser, 'name' | 'status' | 'utcOffset' | 'statusText' | 'avatarETag' | 'roles' | 'username'>> & Required<Pick<IUser, '_id'>>
>;

export type UsersEndpoints = {
	'/v1/users.info': {
		GET: (params: { userId?: IUser['_id']; userName?: IUser['username'] }) => {
			user: IUser;
		};
	};
	'/v1/users.2fa.sendEmailCode': {
		POST: (params: { emailOrUsername: string }) => void;
	};
	'/v1/users.autocomplete': {
		GET: (params: { selector: string }) => { items: IUser[] };
	};
	'/v1/users.listTeams': {
		GET: (params: { userId: IUser['_id'] }) => { teams: Array<ITeam> };
	};
	'/v1/users.setAvatar': {
		POST: (params: { userId?: IUser['_id']; username?: IUser['username']; avatarUrl?: string }) => void;
	};
	'/v1/users.resetAvatar': {
		POST: (params: { userId?: IUser['_id']; username?: IUser['username'] }) => void;
	};
	'/v1/users.presence': {
		GET: (params: { ids: string[] }) => UsersPresencePayload;
	};
};
