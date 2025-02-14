import type { IRocketChatRecord, IRoom, IUser } from '@rocket.chat/core-typings';

export type RoomAccessValidator = (
	room?: Pick<IRoom, '_id' | 't' | 'teamId' | 'prid'>,
	user?: Pick<IUser, '_id'>,
	extraData?: Record<string, any>,
) => Promise<boolean>;

type Head<T extends any[]> = T extends [...infer U, any?] ? U : never;
type RemoveLastParameter<T extends (...args: any[]) => any> = (...args: Head<Parameters<T>>) => ReturnType<T>;

export type RoomReadValidator = RemoveLastParameter<RoomAccessValidator>;

export interface IAuthorization {
	hasAllPermission(userId: string, permissions: string[], scope?: string): Promise<boolean>;
	hasPermission(userId: string, permissionId: string, scope?: string): Promise<boolean>;
	hasAtLeastOnePermission(userId: string, permissions: string[], scope?: string): Promise<boolean>;
	canAccessRoom: RoomAccessValidator;
	canReadRoom: RoomReadValidator;
	canAccessRoomId(rid: IRoom['_id'], uid?: IUser['_id']): Promise<boolean>;
	getUsersFromPublicRoles(): Promise<(IRocketChatRecord & Pick<IUser, '_id' | 'username' | 'roles'>)[]>;
}
