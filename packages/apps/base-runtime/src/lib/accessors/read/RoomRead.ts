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

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

export class RoomRead implements IRoomRead {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public getById(id: string): Promise<IRoom> {
		return bridgeCall<IRoom>(this.senderFn, 'getRoomBridge', 'doGetById', id, 'APP_ID');
	}

	public getCreatorUserById(id: string): Promise<IUser> {
		return bridgeCall<IUser>(this.senderFn, 'getRoomBridge', 'doGetCreatorById', id, 'APP_ID');
	}

	public getByName(name: string): Promise<IRoom> {
		return bridgeCall<IRoom>(this.senderFn, 'getRoomBridge', 'doGetByName', name, 'APP_ID');
	}

	public getCreatorUserByName(name: string): Promise<IUser> {
		return bridgeCall<IUser>(this.senderFn, 'getRoomBridge', 'doGetCreatorByName', name, 'APP_ID');
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

		return bridgeCall<IMessageRaw[]>(this.senderFn, 'getRoomBridge', 'doGetMessages', roomId, options as GetMessagesOptions, 'APP_ID');
	}

	public getMembers(roomId: string): Promise<Array<IUser>> {
		return bridgeCall<Array<IUser>>(this.senderFn, 'getRoomBridge', 'doGetMembers', roomId, 'APP_ID');
	}

	public getAllRooms(filters: GetRoomsFilters = {}, { limit = 100, skip = 0 }: GetRoomsOptions = {}): Promise<Array<IRoomRaw> | undefined> {
		if (!Number.isFinite(limit) || limit <= 0 || limit > 100) {
			throw new Error(`Invalid limit provided. Expected number between 1 and 100, got ${limit}`);
		}

		if (!Number.isFinite(skip) || skip < 0) {
			throw new Error(`Invalid skip provided. Expected number >= 0, got ${skip}`);
		}

		return bridgeCall<Array<IRoomRaw> | undefined>(this.senderFn, 'getRoomBridge', 'doGetAllRooms', filters, { limit, skip }, 'APP_ID');
	}

	public getDirectByUsernames(usernames: Array<string>): Promise<IRoom> {
		return bridgeCall<IRoom>(this.senderFn, 'getRoomBridge', 'doGetDirectByUsernames', usernames, 'APP_ID');
	}

	public getModerators(roomId: string): Promise<Array<IUser>> {
		return bridgeCall<Array<IUser>>(this.senderFn, 'getRoomBridge', 'doGetModerators', roomId, 'APP_ID');
	}

	public getOwners(roomId: string): Promise<Array<IUser>> {
		return bridgeCall<Array<IUser>>(this.senderFn, 'getRoomBridge', 'doGetOwners', roomId, 'APP_ID');
	}

	public getLeaders(roomId: string): Promise<Array<IUser>> {
		return bridgeCall<Array<IUser>>(this.senderFn, 'getRoomBridge', 'doGetLeaders', roomId, 'APP_ID');
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

		return bridgeCall<IMessageRaw[]>(this.senderFn, 'getRoomBridge', 'doGetUnreadByUser', roomId, uid, completeOptions, 'APP_ID');
	}

	public getUserUnreadMessageCount(roomId: string, uid: string): Promise<number> {
		return bridgeCall<number>(this.senderFn, 'getRoomBridge', 'doGetUserUnreadMessageCount', roomId, uid, 'APP_ID');
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
