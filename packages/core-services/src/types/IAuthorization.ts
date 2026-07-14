import type { IRoom, IUser, IRole } from '@rocket.chat/core-typings';

export type RoomAccessValidator = (
	room?: Pick<IRoom, '_id' | 't' | 'teamId' | 'prid' | 'abacAttributes'>,
	user?: IUser | Pick<IUser, '_id'>,
	extraData?: Record<string, any>,
) => Promise<boolean>;

export interface IAuthorization {
	hasAllPermission(user: string | IUser, permissions: string[], scope?: string): Promise<boolean>;
	hasPermission(user: string | IUser, permissionId: string, scope?: string): Promise<boolean>;
	hasAtLeastOnePermission(user: string | IUser, permissions: string[], scope?: string): Promise<boolean>;
	canAccessRoom: RoomAccessValidator;
	canReadRoom: RoomAccessValidator;
	canAccessRoomId(rid: IRoom['_id'], uid?: IUser['_id']): Promise<boolean>;
	getUsersFromPublicRoles(): Promise<Pick<Required<IUser>, '_id' | 'username' | 'roles'>[]>;
	hasAnyRole(userId: IUser['_id'], roleIds: IRole['_id'][], scope?: IRoom['_id']): Promise<boolean>;
}
