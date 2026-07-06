import type { IRoomRead } from '@rocket.chat/apps-engine/definition/accessors';
import type { IMessageRaw } from '@rocket.chat/apps-engine/definition/messages';
import type { IRoom, IRoomRaw } from '@rocket.chat/apps-engine/definition/rooms';
import {
	type GetMessagesOptions,
	type GetRoomsFilters,
	type GetRoomsOptions,
	GetMessagesSortableFields,
} from '@rocket.chat/apps-engine/definition/rooms/IGetMessagesOptions';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

export class RoomRead implements IRoomRead {
	constructor(private readonly bridges: RemoteBridges) {}

	public getById(id: string): Promise<IRoom> {
		return this.bridges.getRoomBridge().doGetById(id, 'APP_ID') as Promise<IRoom>;
	}

	public getCreatorUserById(id: string): Promise<IUser> {
		return this.bridges.getRoomBridge().doGetCreatorById(id, 'APP_ID') as Promise<IUser>;
	}

	public getByName(name: string): Promise<IRoom> {
		return this.bridges.getRoomBridge().doGetByName(name, 'APP_ID') as Promise<IRoom>;
	}

	public getCreatorUserByName(name: string): Promise<IUser> {
		return this.bridges.getRoomBridge().doGetCreatorByName(name, 'APP_ID') as Promise<IUser>;
	}

	public getMessages(roomId: string, options: Partial<GetMessagesOptions> = {}): Promise<IMessageRaw[]> {
		if (typeof options.limit !== 'undefined' && (!Number.isFinite(options.limit) || options.limit > 100)) {
			throw new Error(`Invalid limit provided. Expected number <= 100, got ${options.limit}`);
		}

		options.limit ??= 100;
		options.showThreadMessages ??= true;

		if (options.sort) {
			this.validateSort(options.sort);
		}

		return this.bridges.getRoomBridge().doGetMessages(roomId, options as GetMessagesOptions, 'APP_ID') as Promise<IMessageRaw[]>;
	}

	public getMembers(roomId: string): Promise<Array<IUser>> {
		return this.bridges.getRoomBridge().doGetMembers(roomId, 'APP_ID') as Promise<Array<IUser>>;
	}

	public getAllRooms(filters: GetRoomsFilters = {}, { limit = 100, skip = 0 }: GetRoomsOptions = {}): Promise<Array<IRoomRaw> | undefined> {
		if (!Number.isFinite(limit) || limit <= 0 || limit > 100) {
			throw new Error(`Invalid limit provided. Expected number between 1 and 100, got ${limit}`);
		}

		if (!Number.isFinite(skip) || skip < 0) {
			throw new Error(`Invalid skip provided. Expected number >= 0, got ${skip}`);
		}

		return this.bridges.getRoomBridge().doGetAllRooms(filters, { limit, skip }, 'APP_ID') as Promise<Array<IRoomRaw> | undefined>;
	}

	public getDirectByUsernames(usernames: Array<string>): Promise<IRoom> {
		return this.bridges.getRoomBridge().doGetDirectByUsernames(usernames, 'APP_ID') as Promise<IRoom>;
	}

	public getModerators(roomId: string): Promise<Array<IUser>> {
		return this.bridges.getRoomBridge().doGetModerators(roomId, 'APP_ID') as Promise<Array<IUser>>;
	}

	public getOwners(roomId: string): Promise<Array<IUser>> {
		return this.bridges.getRoomBridge().doGetOwners(roomId, 'APP_ID') as Promise<Array<IUser>>;
	}

	public getLeaders(roomId: string): Promise<Array<IUser>> {
		return this.bridges.getRoomBridge().doGetLeaders(roomId, 'APP_ID') as Promise<Array<IUser>>;
	}

	public async getUnreadByUser(roomId: string, uid: string, options: Partial<GetMessagesOptions> = {}): Promise<IMessageRaw[]> {
		const { limit = 100, sort = { createdAt: 'asc' }, skip = 0, showThreadMessages = true } = options;

		if (typeof roomId !== 'string' || roomId.trim().length === 0) {
			throw new Error('Invalid roomId: must be a non-empty string');
		}

		if (!Number.isFinite(limit) || limit <= 0 || limit > 100) {
			throw new Error(`Invalid limit provided. Expected number between 1 and 100, got ${limit}`);
		}

		this.validateSort(sort);

		const completeOptions: GetMessagesOptions = { limit, sort, skip, showThreadMessages };

		return this.bridges.getRoomBridge().doGetUnreadByUser(roomId, uid, completeOptions, 'APP_ID') as Promise<IMessageRaw[]>;
	}

	public getUserUnreadMessageCount(roomId: string, uid: string): Promise<number> {
		return this.bridges.getRoomBridge().doGetUserUnreadMessageCount(roomId, uid, 'APP_ID') as Promise<number>;
	}

	// If there are any invalid fields or values, throw
	private validateSort(sort: Record<string, unknown>) {
		Object.entries(sort).forEach(([key, value]) => {
			if (!GetMessagesSortableFields.includes(key as (typeof GetMessagesSortableFields)[number])) {
				throw new Error(`Invalid key "${key}" used in sort. Available keys for sorting are ${GetMessagesSortableFields.join(', ')}`);
			}

			if (value !== 'asc' && value !== 'desc') {
				throw new Error(`Invalid sort direction for field "${key}". Expected "asc" or "desc", got ${value}`);
			}
		});
	}
}
