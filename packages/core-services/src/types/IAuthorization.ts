import type { IRoom, IUser, IRole } from '@rocket.chat/core-typings';

export type RoomAccessValidator = (
	room?: Pick<IRoom, '_id' | 't' | 'teamId' | 'prid' | 'abacAttributes'>,
	user?: Pick<IUser, '_id'>,
	extraData?: Record<string, any>,
) => Promise<boolean>;

export interface IAuthorization {
	hasAllPermission(userId: string, permissions: string[], scope?: string): Promise<boolean>;
	hasPermission(userId: string, permissionId: string, scope?: string): Promise<boolean>;
	hasAtLeastOnePermission(userId: string, permissions: string[], scope?: string): Promise<boolean>;
	canAccessRoom: RoomAccessValidator;
	canReadRoom: RoomAccessValidator;
	canAccessRoomId(rid: IRoom['_id'], uid?: IUser['_id']): Promise<boolean>;
	getUsersFromPublicRoles(): Promise<Pick<Required<IUser>, '_id' | 'username' | 'roles'>[]>;
	hasAnyRole(userId: IUser['_id'], roleIds: IRole['_id'][], scope?: IRoom['_id']): Promise<boolean>;

	disable2FA(uid: string): Promise<boolean>;
	enable2FA(uid: string): Promise<void>;
	validateTempToken(uid: string, token: string): Promise<boolean | null>;
	check2FARemainingCodes(uid: string): Promise<{ remaining: number }>;
	regenerate2FACodes(uid: string): Promise<{ codes: string[] }>;
}
