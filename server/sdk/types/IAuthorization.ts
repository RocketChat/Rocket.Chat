import { IRoom } from '../../../definition/IRoom';
import { IUser, IRole } from '../../../definition/IUser';

export type RoomAccessValidator = (room: Partial<IRoom>, user: Partial<IUser>, extraData?: Record<string, any>) => Promise<boolean>;

export interface IAuthorization {
	hasAllPermission(userId: string, permissions: string[], scope?: string): Promise<boolean>;
	hasPermission(userId: string, permissionId: string, scope?: string): Promise<boolean>;
	hasAtLeastOnePermission(userId: string, permissions: string[], scope?: string): Promise<boolean>;
	addRoleRestrictions(role: IRole['_id'], permissions: string[]): Promise<void>;
	canAccessRoom: RoomAccessValidator;
}
