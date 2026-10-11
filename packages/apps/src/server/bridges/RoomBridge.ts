import type { IMessage, IMessageRaw } from '@rocket.chat/apps-engine/definition/messages';
import type { IRoom, IRoomRaw } from '@rocket.chat/apps-engine/definition/rooms';
import { GetMessagesSortableFields } from '@rocket.chat/apps-engine/definition/rooms/IGetMessagesOptions';
import type { GetMessagesOptions, GetRoomsFilters, GetRoomsOptions } from '@rocket.chat/apps-engine/definition/rooms/IGetMessagesOptions';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import { BaseBridge } from './BaseBridge';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissionManager } from '../managers/AppPermissionManager';
import { AppPermissions } from '../permissions/AppPermissions';

export { GetMessagesSortableFields };
export type { GetMessagesOptions, GetRoomsFilters, GetRoomsOptions };

const READ_ONLY_ROOM_FIELDS = ['abacAttributes'] as const;

const stripReadOnlyRoomFields = (room: IRoom): IRoom => {
	for (const field of READ_ONLY_ROOM_FIELDS) {
		delete room[field];

		// This prevents the field being added when a room gets created
		// since on room creation `isPartial=false` and so these props are spread on the final room object
		// If we need to allow abac room creation from apps, we would need to remove this.
		delete (room as any)._unmappedProperties_?.[field];
	}

	return room;
};

export abstract class RoomBridge extends BaseBridge {
	public async doCreate(room: IRoom, members: Array<string>, appId: string): Promise<string> {
		if (this.hasWritePermission(appId)) {
			return this.create(stripReadOnlyRoomFields(room), members, appId);
		}
	}

	public async doGetById(roomId: string, appId: string): Promise<IRoom> {
		if (this.hasReadPermission(appId)) {
			return this.getById(roomId, appId);
		}
	}

	public async doGetByName(roomName: string, appId: string): Promise<IRoom> {
		if (this.hasReadPermission(appId)) {
			return this.getByName(roomName, appId);
		}
	}

	public async doGetCreatorById(roomId: string, appId: string): Promise<IUser | undefined> {
		if (this.hasReadPermission(appId)) {
			return this.getCreatorById(roomId, appId);
		}
	}

	public async doGetCreatorByName(roomName: string, appId: string): Promise<IUser | undefined> {
		if (this.hasReadPermission(appId)) {
			return this.getCreatorByName(roomName, appId);
		}
	}

	public async doGetDirectByUsernames(usernames: Array<string>, appId: string): Promise<IRoom | undefined> {
		if (this.hasReadPermission(appId)) {
			return this.getDirectByUsernames(usernames, appId);
		}
	}

	public async doGetMembers(roomId: string, appId: string): Promise<Array<IUser>> {
		if (this.hasReadPermission(appId)) {
			return this.getMembers(roomId, appId);
		}
	}

	public async doGetAllRooms(
		filters: GetRoomsFilters = {},
		options: GetRoomsOptions = {},
		appId: string,
	): Promise<Array<IRoomRaw> | undefined> {
		if (this.hasViewAllRoomsPermission(appId)) {
			return this.getAllRooms(filters, options, appId);
		}
	}

	public async doUpdate(room: IRoom, members: Array<string>, appId: string): Promise<void> {
		if (this.hasWritePermission(appId)) {
			return this.update(stripReadOnlyRoomFields(room), members, appId);
		}
	}

	public async doCreateDiscussion(
		room: IRoom,
		parentMessage: IMessage | undefined,
		reply: string | undefined,
		members: Array<string>,
		appId: string,
	): Promise<string> {
		if (this.hasWritePermission(appId)) {
			return this.createDiscussion(stripReadOnlyRoomFields(room), parentMessage, reply, members, appId);
		}
	}

	public async doDelete(room: string, appId: string): Promise<void> {
		if (this.hasWritePermission(appId)) {
			return this.delete(room, appId);
		}
	}

	public async doGetModerators(roomId: string, appId: string): Promise<Array<IUser>> {
		if (this.hasReadPermission(appId)) {
			return this.getModerators(roomId, appId);
		}
	}

	public async doGetOwners(roomId: string, appId: string): Promise<Array<IUser>> {
		if (this.hasReadPermission(appId)) {
			return this.getOwners(roomId, appId);
		}
	}

	public async doGetLeaders(roomId: string, appId: string): Promise<Array<IUser>> {
		if (this.hasReadPermission(appId)) {
			return this.getLeaders(roomId, appId);
		}
	}

	public async doGetMessages(roomId: string, options: GetMessagesOptions, appId: string): Promise<IMessageRaw[]> {
		if (this.hasReadPermission(appId)) {
			return this.getMessages(roomId, options, appId);
		}
	}

	public async doRemoveUsers(roomId: string, usernames: Array<string>, appId: string): Promise<void> {
		if (this.hasWritePermission(appId)) {
			return this.removeUsers(roomId, usernames, appId);
		}
	}

	public async doGetUnreadByUser(roomId: string, uid: string, options: GetMessagesOptions, appId: string): Promise<IMessageRaw[]> {
		if (this.hasReadPermission(appId)) {
			return this.getUnreadByUser(roomId, uid, options, appId);
		}
	}

	public async doGetUserUnreadMessageCount(roomId: string, uid: string, appId: string): Promise<number> {
		if (this.hasReadPermission(appId)) {
			return this.getUserUnreadMessageCount(roomId, uid, appId);
		}
	}

	protected abstract create(room: IRoom, members: Array<string>, appId: string): Promise<string>;

	protected abstract getById(roomId: string, appId: string): Promise<IRoom>;

	protected abstract getByName(roomName: string, appId: string): Promise<IRoom>;

	protected abstract getCreatorById(roomId: string, appId: string): Promise<IUser | undefined>;

	protected abstract getCreatorByName(roomName: string, appId: string): Promise<IUser | undefined>;

	protected abstract getDirectByUsernames(usernames: Array<string>, appId: string): Promise<IRoom | undefined>;

	protected abstract getMembers(roomId: string, appId: string): Promise<Array<IUser>>;

	protected abstract getAllRooms(filters: GetRoomsFilters, options: GetRoomsOptions, appId: string): Promise<Array<IRoomRaw>>;

	protected abstract update(room: IRoom, members: Array<string>, appId: string): Promise<void>;

	protected abstract createDiscussion(
		room: IRoom,
		parentMessage: IMessage | undefined,
		reply: string | undefined,
		members: Array<string>,
		appId: string,
	): Promise<string>;

	protected abstract delete(room: string, appId: string): Promise<void>;

	protected abstract getModerators(roomId: string, appId: string): Promise<Array<IUser>>;

	protected abstract getOwners(roomId: string, appId: string): Promise<Array<IUser>>;

	protected abstract getLeaders(roomId: string, appId: string): Promise<Array<IUser>>;

	protected abstract getMessages(roomId: string, options: GetMessagesOptions, appId: string): Promise<IMessageRaw[]>;

	protected abstract removeUsers(roomId: string, usernames: Array<string>, appId: string): Promise<void>;

	protected abstract getUnreadByUser(roomId: string, uid: string, options: GetMessagesOptions, appId: string): Promise<IMessageRaw[]>;

	protected abstract getUserUnreadMessageCount(roomId: string, uid: string, appId: string): Promise<number>;

	private hasWritePermission(appId: string): boolean {
		if (AppPermissionManager.hasPermission(appId, AppPermissions.room.write)) {
			return true;
		}

		AppPermissionManager.notifyAboutError(
			new PermissionDeniedError({
				appId,
				missingPermissions: [AppPermissions.room.write],
			}),
		);

		return false;
	}

	private hasReadPermission(appId: string): boolean {
		if (AppPermissionManager.hasPermission(appId, AppPermissions.room.read)) {
			return true;
		}

		AppPermissionManager.notifyAboutError(
			new PermissionDeniedError({
				appId,
				missingPermissions: [AppPermissions.room.read],
			}),
		);

		return false;
	}

	private hasViewAllRoomsPermission(appId: string): boolean {
		if (AppPermissionManager.hasPermission(appId, AppPermissions.room['system-view-all'])) {
			return true;
		}

		AppPermissionManager.notifyAboutError(
			new PermissionDeniedError({
				appId,
				missingPermissions: [AppPermissions.room['system-view-all']],
			}),
		);

		return false;
	}
}
