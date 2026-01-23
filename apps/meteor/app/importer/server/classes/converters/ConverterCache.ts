import type { IImportUser, IUser } from '@rocket.chat/core-typings';
import { Rooms, Users } from '@rocket.chat/models';

export type UserIdentification = {
	_id: string;
	username: string | undefined;
};

export type MentionedChannel = {
	_id: string;
	name: string;
};

export class ConverterCache {
	private _userCache = new Map<string, UserIdentification>();

	// display name uses a different cache because it's only used on mentions so we don't need to load it every time we load an user
	private _userDisplayNameCache = new Map<string, string>();

	private _userNameToIdCache = new Map<string, string | undefined>();

	private _roomCache = new Map<string, string>();

	private _roomNameCache = new Map<string, string>();

	addUser(importId: string, _id: string, username: string | undefined): UserIdentification {
		const cache = {
			_id,
			username,
		};

		this._userCache.set(importId, cache);
		if (username) {
			this._userNameToIdCache.set(username, _id);
		}
		return cache;
	}

	addUserDisplayName(importId: string, name: string): string {
		this._userDisplayNameCache.set(importId, name);
		return name;
	}

	addRoom(importId: string, rid: string): string {
		this._roomCache.set(importId, rid);
		return rid;
	}

	addRoomName(importId: string, name: string): string {
		this._roomNameCache.set(importId, name);
		return name;
	}

	addUserData(userData: IImportUser): void {
		if (!userData._id) {
			return;
		}
		if (!userData.importIds.length) {
			return;
		}

		this.addUser(userData.importIds[0], userData._id, userData.username);
	}

	addUsernameToId(username: string, id: string): void {
		this._userNameToIdCache.set(username, id);
	}

	async findImportedRoomId(importId: string): Promise<string | null> {
		if (this._roomCache.has(importId)) {
			return this._roomCache.get(importId) as string;
		}

		const options = {
			projection: {
				_id: 1,
			},
		};

		const room = await Rooms.findOneByImportId(importId, options);
		if (room) {
			return this.addRoom(importId, room._id);
		}

		return null;
	}

	async findImportedRoomName(importId: string): Promise<string | undefined> {
		if (this._roomNameCache.has(importId)) {
			return this._roomNameCache.get(importId) as string;
		}

		const options = {
			projection: {
				_id: 1,
				name: 1,
			},
		};

		const room = await Rooms.findOneByImportId(importId, options);
		if (room) {
			if (!this._roomCache.has(importId)) {
				this.addRoom(importId, room._id);
			}
			if (room?.name) {
				return this.addRoomName(importId, room.name);
			}
		}
	}

	async findImportedUser(importId: string): Promise<UserIdentification | null> {
		if (importId === 'rocket.cat') {
			return {
				_id: 'rocket.cat',
				username: 'rocket.cat',
			};
		}

		const options = {
			projection: {
				_id: 1,
				username: 1,
			},
		};

		if (this._userCache.has(importId)) {
			return this._userCache.get(importId) as UserIdentification;
		}

		const user = await Users.findOneByImportId(importId, options);
		if (user) {
			return this.addUser(importId, user._id, user.username);
		}

		return null;
	}

	async findImportedUserId(_id: string): Promise<string | undefined> {
		const data = await this.findImportedUser(_id);
		return data?._id;
	}

	async findImportedUsername(_id: string): Promise<string | undefined> {
		const data = await this.findImportedUser(_id);
		return data?.username;
	}

	async findImportedUserDisplayName(importId: string): Promise<string | undefined> {
		const options = {
			projection: {
				_id: 1,
				name: 1,
				username: 1,
			},
		};

		if (this._userDisplayNameCache.has(importId)) {
			return this._userDisplayNameCache.get(importId);
		}

		const user =
			importId === 'rocket.cat' ? await Users.findOneById('rocket.cat', options) : await Users.findOneByImportId(importId, options);
		if (user) {
			if (!this._userCache.has(importId)) {
				this.addUser(importId, user._id, user.username);
			}

			if (!user.name) {
				return;
			}

			return this.addUserDisplayName(importId, user.name);
		}
	}

	async convertImportedIdsToUsernames(importedIds: Array<string>, idToRemove: string | undefined = undefined): Promise<Array<string>> {
		return (
			await Promise.all(
				importedIds.map(async (user) => {
					if (user === 'rocket.cat') {
						return user;
					}

					if (this._userCache.has(user)) {
						const cache = this._userCache.get(user);
						if (cache) {
							return cache.username;
						}
					}

					const obj = await Users.findOneByImportId(user, { projection: { _id: 1, username: 1 } });
					if (obj) {
						this.addUser(user, obj._id, obj.username);

						if (idToRemove && obj._id === idToRemove) {
							return false;
						}

						return obj.username;
					}

					return false;
				}),
			)
		).filter((user) => user) as string[];
	}

	async getIdOfUsername(username: string | undefined): Promise<string | undefined> {
		if (!username) {
			return;
		}

		if (this._userNameToIdCache.has(username)) {
			return this._userNameToIdCache.get(username);
		}

		const user = await Users.findOneByUsername<Pick<IUser, '_id'>>(username, { projection: { _id: 1 } });
		if (user) {
			this.addUsernameToId(username, user._id);
		}

		return user?._id;
	}
}
