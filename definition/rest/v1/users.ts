import type { ITeam } from '../../ITeam';
import type { IUser } from '../../IUser';

export type UsersEndpoints = {
	'users.info': {
		GET: (params: { userId?: IUser['_id']; userName?: IUser['username'] }) => { user: IUser };
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
};
