import { UpdateWriteOpResult } from 'mongodb';

import { IRole, IUser } from '../../../../definition/IUser';
import { BaseRaw } from './BaseRaw';

export interface IUserRaw extends BaseRaw<IUser> {
	isUserInRole(uid: IUser['_id'], name: IRole['name']): Promise<boolean>;
	removeRolesByUserId(uid: IUser['_id'], roles: IRole['name'][]): Promise<UpdateWriteOpResult>;
	findUsersInRoles(roles: IRole['name'][]): Promise<IUser[]>;
	addRolesByUserId(uid: IUser['_id'], roles: IRole['name'][]): Promise<UpdateWriteOpResult>;
	isUserInRoleScope(uid: IUser['_id']): Promise<boolean>;
	new (...args: any): IUser;
}
export const UsersRaw: IUserRaw;
