import type { IRoomRead } from '../../definition/accessors';
import type { IMessageRaw } from '../../definition/messages';
import type { IRoom, IRoomRaw } from '../../definition/rooms';
import type { IUser } from '../../definition/users';
import type { RoomBridge } from '../bridges';
import { type GetMessagesOptions, type GetRoomsFilters, type GetRoomsOptions, GetMessagesSortableFields } from '../bridges/RoomBridge';

export class RoomRead implements IRoomRead {
	constructor(
		private roomBridge: RoomBridge,
		private appId: string,
	) {}

	public getById(id: string): Promise<IRoom> {
		return this.roomBridge.doGetById(id, this.appId);
	}

	public getCreatorUserById(id: string): Promise<IUser> {
		return this.roomBridge.doGetCreatorById(id, this.appId);
	}

	public getByName(name: string): Promise<IRoom> {
		return this.roomBridge.doGetByName(name, this.appId);
	}

	public getCreatorUserByName(name: string): Promise<IUser> {
		return this.roomBridge.doGetCreatorByName(name, this.appId);
	}

	public getMessages(roomId: string, options: Partial<GetMessagesOptions> = {}): Promise<IMessageRaw[]> {
		if (typeof options.limit !== 'undefined' && (!Number.isFinite(options.limit) || options.limit > 100)) {
			throw new Error(`Invalid limit provided. Expected number <= 100, got ${options.limit}`);
		}

		const after = typeof options.after !== 'undefined' ? this.parseMessageCursor(options.after, 'after') : undefined;
		const before = typeof options.before !== 'undefined' ? this.parseMessageCursor(options.before, 'before') : undefined;

		const completeOptions: GetMessagesOptions = {
			limit: options.limit ?? 100,
			skip: options.skip,
			sort: options.sort,
			showThreadMessages: options.showThreadMessages ?? true,
			after,
			before,
		};

		if (completeOptions.sort) {
			this.validateSort(completeOptions.sort);
		}

		return this.roomBridge.doGetMessages(roomId, completeOptions, this.appId);
	}

	public getMembers(roomId: string): Promise<Array<IUser>> {
		return this.roomBridge.doGetMembers(roomId, this.appId);
	}

	public getAllRooms(filters: GetRoomsFilters = {}, { limit = 100, skip = 0 }: GetRoomsOptions = {}): Promise<Array<IRoomRaw> | undefined> {
		if (!Number.isFinite(limit) || limit <= 0 || limit > 100) {
			throw new Error(`Invalid limit provided. Expected number between 1 and 100, got ${limit}`);
		}

		if (!Number.isFinite(skip) || skip < 0) {
			throw new Error(`Invalid skip provided. Expected number >= 0, got ${skip}`);
		}

		return this.roomBridge.doGetAllRooms(
			filters,
			{ limit, skip },
			this.appId,
		);
	}

	public getDirectByUsernames(usernames: Array<string>): Promise<IRoom> {
		return this.roomBridge.doGetDirectByUsernames(usernames, this.appId);
	}

	public getModerators(roomId: string): Promise<Array<IUser>> {
		return this.roomBridge.doGetModerators(roomId, this.appId);
	}

	public getOwners(roomId: string): Promise<Array<IUser>> {
		return this.roomBridge.doGetOwners(roomId, this.appId);
	}

	public getLeaders(roomId: string): Promise<Array<IUser>> {
		return this.roomBridge.doGetLeaders(roomId, this.appId);
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

		return this.roomBridge.doGetUnreadByUser(roomId, uid, completeOptions, this.appId);
	}

	public getUserUnreadMessageCount(roomId: string, uid: string): Promise<number> {
		return this.roomBridge.doGetUserUnreadMessageCount(roomId, uid, this.appId);
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

	private parseMessageCursor(cursor: unknown, optionName: string): { createdAt: Date } {
		if (!cursor || typeof cursor !== 'object') {
			throw new Error(`Invalid "${optionName}" cursor. Expected an object with { createdAt }.`);
		}

		const { createdAt } = cursor as Partial<{ createdAt: unknown }>;

		const parsedCreatedAt =
			createdAt instanceof Date ? createdAt : typeof createdAt === 'string' || typeof createdAt === 'number' ? new Date(createdAt) : undefined;

		if (!parsedCreatedAt || Number.isNaN(parsedCreatedAt.getTime())) {
			throw new Error(`Invalid "${optionName}" cursor createdAt. Expected a valid Date, got ${createdAt}`);
		}

		return {
			createdAt: parsedCreatedAt,
		};
	}
}
