import { UpdateWriteOpResult } from 'mongodb';

import { IRole, IUser } from '../../../../definition/IUser';
import { BaseRaw } from './BaseRaw';

export interface IUserRaw extends BaseRaw<IUser> {
	isUserInRole(uid: IUser['_id'], roleId: IRole['_id']): Promise<boolean>;
	removeRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][]): Promise<UpdateWriteOpResult>;
	findUsersInRoles(roles: IRole['_id'][]): Promise<IUser[]>;
	addRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][]): Promise<UpdateWriteOpResult>;
	isUserInRoleScope(uid: IUser['_id']): Promise<boolean>;
	new (...args: any): IUser;
}
export const UsersRaw: IUserRaw;
