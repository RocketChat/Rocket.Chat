import { Roles } from '../../../models/server/raw';
import { IUser } from '../../../../definition/IUser';

export const getUsersInRole = (roleName: string, scope?: string): IUser[] => Promise.await(Roles.findUsersInRole(roleName, scope));
