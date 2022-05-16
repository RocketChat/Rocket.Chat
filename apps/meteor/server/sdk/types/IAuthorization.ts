import type { IRoom, IUser } from '@rocket.chat/core-typings';

export type RoomAccessValidator = (
	room: Pick<IRoom, '_id' | 't' | 'teamId' | 'prid' | 'tokenpass'>,
	user: Pick<IUser, '_id'>,
	extraData?: Record<string, any>,
) => Promise<boolean>;

export interface IAuthorization {
	hasAllPermission(userId: string, permissions: string[], scope?: string): Promise<boolean>;
	hasPermission(userId: string, permissionId: string, scope?: string): Promise<boolean>;
	hasAtLeastOnePermission(userId: string, permissions: string[], scope?: string): Promise<boolean>;
	canAccessRoom: RoomAccessValidator;
	canAccessRoomId(rid: IRoom['_id'], uid: IUser['_id']): Promise<boolean>;
}
