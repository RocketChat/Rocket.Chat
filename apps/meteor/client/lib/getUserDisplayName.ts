import { IUser } from '../../definition/IUser';

export const getUserDisplayName = (name: IUser['name'], username: IUser['username'], useRealName: boolean): string | undefined =>
	useRealName ? name || username : username;
