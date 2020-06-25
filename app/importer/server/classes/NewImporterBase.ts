import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import _ from 'underscore';

import { ImportData } from '../models/ImportData';
import { IImportUser } from '../definitions/IImportUser';
import { IImportMessage } from '../definitions/IImportMessage';
import { IImportChannel } from '../definitions/IImportChannel';
import { IImportUserRecord, IImportChannelRecord, IImportMessageRecord } from '../definitions/IImportRecord';
import { Users, Rooms } from '../../../models/server';
import { generateUsernameSuggestion, insertMessage, setUserAvatar } from '../../../lib/server';
import { setUserActiveStatus } from '../../../lib/server/functions/setUserActiveStatus';
import { IUser } from '../../../../definition/IUser';
import '../../../../definition/Meteor';
// import { getValidRoomName } from '../../../utils';

type IRoom = Record<string, any>;
type IUserIdentification = {
	_id: string;
	username: string | undefined;
};

const guessNameFromUsername = (username: string): string =>
	username
		.replace(/\W/g, ' ')
		.replace(/\s(.)/g, (u) => u.toUpperCase())
		.replace(/^(.)/, (u) => u.toLowerCase())
		.replace(/^\w/, (u) => u.toUpperCase());

export class ImporterBase {
	private _userCache: Map<string, IUserIdentification>;

	private _roomCache: Map<string, string>;

	constructor() {
		this._userCache = new Map();
		this._roomCache = new Map();
	}

	addUserToCache(importId: string, _id: string, username: string | undefined): IUserIdentification {
		const cache = {
			_id,
			username,
		};

		this._userCache.set(importId, cache);
		return cache;
	}

	addRoomToCache(importId: string, rid: string): string {
		this._roomCache.set(importId, rid);
		return rid;
	}

	addUserDataToCache(userData: IImportUser): void {
		if (!userData._id) {
			return;
		}
		if (!userData.importIds.length) {
			return;
		}

		this.addUserToCache(userData.importIds[0], userData._id, userData.username);
	}

	addObject(type: string, data: Record<string, any>): void {
		ImportData.model.rawCollection().insert({
			data,
			dataType: type,
		});
	}

	addUser(data: IImportUser): void {
		this.addObject('user', data);
	}

	addChannel(data: IImportChannel): void {
		this.addObject('channel', data);
	}

	addMessage(data: IImportMessage): void {
		this.addObject('message', data);
	}

	updateUserId(_id: string, userData: IImportUser): void {
		const updateData: Record<string, any> = {
			$set: {
				statusText: userData.statusText || undefined,
				roles: userData.roles || ['user'],
				type: userData.type || 'user',
				bio: userData.bio || undefined,
				name: userData.name || undefined,
			},
		};

		if (userData.importIds?.length) {
			updateData.$addToSet = {
				importIds: {
					$each: userData.importIds,
				},
			};
		}

		Users.update({ _id }, updateData);
	}

	updateUser(existingUser: IUser, userData: IImportUser): void {
		userData._id = existingUser._id;

		this.updateUserId(userData._id, userData);

		if (userData.importIds.length) {
			this.addUserToCache(userData.importIds[0], existingUser._id, existingUser.username);
		}

		// Meteor.runAsUser(existingUser._id, () => {
		// 	if (userData.avatarUrl) {
		// 		try {
		// 			setUserAvatar(existingUser, userData.avatarUrl, undefined, 'url');
		// 		} catch (error) {
		// 			// this.logger.warn(`Failed to set ${ userId }'s avatar from url ${ userData.avatarUrl }`);
		// 			console.log(error);
		// 			console.log(`Failed to set ${ existingUser._id }'s avatar from url ${ userData.avatarUrl }`);
		// 		}
		// 	}
		// });
	}

	insertUser(userData: IImportUser): IUser {
		const password = `${ Date.now() }${ userData.name || '' }${ userData.emails.length ? userData.emails[0].toUpperCase() : '' }`;
		const userId = userData.emails.length ? Accounts.createUser({
			email: userData.emails[0],
			password,
		}) : Accounts.createUser({
			username: userData.username,
			password,
			joinDefaultChannelsSilenced: true,
		});

		userData._id = userId;
		const user = Users.findOneById(userId, {});

		if (user && userData.importIds.length) {
			this.addUserToCache(userData.importIds[0], user._id, user.username);
		}

		Meteor.runAsUser(userId, () => {
			Meteor.call('setUsername', userData.username, { joinDefaultChannelsSilenced: true });
			if (userData.name) {
				Users.setName(userId, userData.name);
			}

			this.updateUserId(userId, userData);

			if (userData.utcOffset) {
				Users.setUtcOffset(userId, userData.utcOffset);
			}

			if (userData.avatarUrl) {
				try {
					setUserAvatar(user, userData.avatarUrl, undefined, 'url');
				} catch (error) {
					// this.logger.warn(`Failed to set ${ userId }'s avatar from url ${ userData.avatarUrl }`);
					// this.logger.error(error);
					console.log(error);
					console.log(`Failed to set ${ userId }'s avatar from url ${ userData.avatarUrl }`);
				}
			}
		});

		return user;
	}

	convertUsers(): void {
		const users = ImportData.find({ dataType: 'user' });
		users.forEach(({ data, _id }: IImportUserRecord) => {
			try {
				data.emails = data.emails.filter((item) => item);
				data.importIds = data.importIds.filter((item) => item);

				if (!data.emails.length && !data.username) {
					throw new Error('importer-user-missing-email-and-username');
				}

				let existingUser;
				if (data.emails.length) {
					existingUser = Users.findOneByEmailAddress(data.emails[0], {});
				}

				if (data.username) {
					// If we couldn't find one by their email address, try to find an existing user by their username
					if (!existingUser) {
						existingUser = Users.findOneByUsernameIgnoringCase(data.username, {});
					}
				} else {
					data.username = generateUsernameSuggestion({
						name: data.name,
						emails: data.emails,
					});
				}

				if (existingUser) {
					this.updateUser(existingUser, data);
				} else {
					if (!data.name && data.username) {
						data.name = guessNameFromUsername(data.username);
					}

					existingUser = this.insertUser(data);
				}

				// Deleted users are 'inactive' users in Rocket.Chat
				if (data.deleted && existingUser?.active) {
					setUserActiveStatus(data._id, false, true);
				}
			} catch (e) {
				this.saveError(_id, e);
			}
		});
	}

	saveNewId(importId: string, newId: string): void {
		ImportData.update({
			_id: importId,
		}, {
			$set: {
				id: newId,
			},
		});
	}

	saveError(importId: string, error: Error): void {
		console.log(error);
		ImportData.update({
			_id: importId,
		}, {
			$push: {
				errors: {
					message: error.message,
					stack: error.stack,
				},
			},
		});
	}

	convertMessages(): void {
		// const rooms = ImportData.model.rawCollection().find({
		// 	dataType: 'message',
		// 	$or: [
		// 		{

		// 		}
		// 	]
		// });

		const messages = ImportData.find({ dataType: 'message' });
		messages.forEach(({ data: m, _id }: IImportMessageRecord) => {
			try {
				if (!m.ts || isNaN(m.ts as unknown as number)) {
					throw new Error('importer-message-invalid-timestamp');
				}

				const creator = this.findImportedUser(m.u._id);
				if (!creator) {
					throw new Error('importer-message-unknown-user');
				}

				const rid = this.findImportedRoomId(m.rid);
				if (!rid) {
					throw new Error('importer-message-unknown-room');
				}

				const msgObj = {
					_id: m._id || undefined,
					ts: m.ts,
					msg: m.msg,
					t: m.t || undefined,
					rid,
					u: {
						_id: creator._id,
						username: creator.username,
					},
				};

				insertMessage(creator, msgObj, rid, true);
			} catch (e) {
				this.saveError(_id, e);
				throw e;
			}
		});
	}

	updateRoom(room: IRoom, roomData: IImportChannel, startedByUserId: string): void {
		roomData._id = room._id;

		// eslint-disable-next-line no-extra-parens
		if ((roomData._id as string).toUpperCase() === 'GENERAL' && roomData.name !== room.name) {
			Meteor.runAsUser(startedByUserId, () => {
				Meteor.call('saveRoomSettings', 'GENERAL', 'roomName', roomData.name);
			});
		}

		this.updateRoomId(room._id, roomData);
	}

	findImportedRoomId(importId: string): string | null {
		if (this._roomCache.has(importId)) {
			return this._roomCache.get(importId) as string;
		}

		const options = {
			fields: {
				_id: 1,
			},
		};

		const room = Rooms.findOneByImportId(importId, options);
		if (room) {
			return this.addRoomToCache(importId, room._id);
		}

		return null;
	}

	findImportedUser(importId: string): IUserIdentification | null {
		const options = {
			fields: {
				_id: 1,
				username: 1,
			},
		};

		if (importId === 'rocket.cat') {
			return {
				_id: 'rocket.cat',
				username: 'rocket.cat',
			};
		}

		if (this._userCache.has(importId)) {
			return this._userCache.get(importId) as IUserIdentification;
		}

		const user = Users.findOneByImportId(importId, options);
		if (user) {
			return this.addUserToCache(importId, user._id, user.username);
		}

		return null;
	}

	findImportedUserId(_id: string): string | undefined {
		const data = this.findImportedUser(_id);
		return data?._id;
	}

	updateRoomId(_id: string, roomData: IImportChannel): void {
		const set = {
			ts: roomData.ts,
			topic: roomData.topic,
			description: roomData.description,
		};

		const roomUpdate = {};

		if (Object.keys(set).length > 0) {
			roomUpdate.$set = set;
		}

		if (roomData.importIds.length) {
			roomUpdate.$addToSet = {
				importIds: {
					$each: roomData.importIds,
				},
			};
		}

		if (roomUpdate.$set || roomUpdate.$addToSet) {
			Rooms.update({ _id: roomData._id }, roomUpdate);
		}
	}

	getRoomCreatorId(roomData: IImportChannel, startedByUserId: string): string {
		if (roomData.u) {
			const creatorId = this.findImportedUserId(roomData.u._id);
			if (creatorId) {
				return creatorId;
			}

			if (roomData.t !== 'd') {
				return startedByUserId;
			}

			throw new Error('importer-channel-invalid-creator');
		}

		if (roomData.t === 'd') {
			for (const member of roomData.users) {
				const userId = this.findImportedUserId(member);
				if (userId) {
					return userId;
				}
			}
		}

		throw new Error('importer-channel-invalid-creator');
	}

	insertRoom(roomData: IImportChannel, startedByUserId: string): void {
		// Find the rocketchatId of the user who created this channel
		const creatorId = this.getRoomCreatorId(roomData, startedByUserId);
		const members = this.convertImportedIdsToUsernames(roomData.users, roomData.t !== 'd' ? creatorId : undefined);

		if (roomData.t === 'd') {
			if (members.length < roomData.users.length) {
				throw new Error('importer-channel-missing-users');
			}
		}

		// Create the channel
		try {
			Meteor.runAsUser(creatorId, () => {
				const roomInfo = roomData.t === 'd'
					? Meteor.call('createDirectMessage', ...members)
					: Meteor.call(roomData.t === 'p' ? 'createPrivateGroup' : 'createChannel', roomData.name, members);

				roomData._id = roomInfo.rid;
			});
		} catch (e) {
			console.log(roomData.name, members);
			console.log(e);
			throw e;
		}

		this.updateRoomId(roomData._id, roomData);
	}

	convertImportedIdsToUsernames(importedIds: Array<string>, idToRemove: string | undefined = undefined): Array<string> {
		return importedIds.map((user) => {
			if (user === 'rocket.cat') {
				return user;
			}

			if (this._userCache.has(user)) {
				const cache = this._userCache.get(user);
				if (cache) {
					return cache.username;
				}
			}

			const obj = Users.findOneByImportId(user, { fields: { _id: 1, username: 1 } });
			if (obj) {
				this.addUserToCache(user, obj._id, obj.username);

				if (idToRemove && obj._id === idToRemove) {
					return false;
				}

				return obj.username;
			}

			return false;
		}).filter((user) => user);
	}

	findExistingRoom(data: IImportChannel): IRoom {
		if (data._id && data._id.toUpperCase() === 'GENERAL') {
			const room = Rooms.findOneById('GENERAL', {});
			// Prevent the importer from trying to create a new general
			if (!room) {
				throw new Error('importer-channel-general-not-found');
			}

			return room;
		}

		if (data.t === 'd') {
			const users = this.convertImportedIdsToUsernames(data.users);
			if (users.length !== data.users.length) {
				throw new Error('importer-channel-missing-users');
			}

			return Rooms.findDirectRoomContainingAllUsernames(users, {});
		}

		return Rooms.findOneByNonValidatedName(data.name, {});
	}

	convertChannels(startedByUserId: string): void {
		const channels = ImportData.find({ dataType: 'channel' });
		channels.forEach(({ data: c, _id }: IImportChannelRecord) => {
			try {
				if (!c.name && c.t !== 'd') {
					throw new Error('importer-channel-missing-name');
				}

				c.importIds = c.importIds.filter((item) => item);
				c.users = _.uniq(c.users);

				if (!c.importIds.length) {
					throw new Error('importer-channel-missing-import-id');
				}

				const existingRoom = this.findExistingRoom(c);

				if (existingRoom) {
					this.updateRoom(existingRoom, c, startedByUserId);
				} else {
					this.insertRoom(c, startedByUserId);
				}
			} catch (e) {
				this.saveError(_id, e);
			}
		});
	}

	convertData(startedByUserId: string): void {
		this.convertUsers();
		this.convertChannels(startedByUserId);
		this.convertMessages();
	}

	clearImportData(keepErrors = false): void {
		if (keepErrors) {
			ImportData.model.rawCollection().remove({
				errors: {
					$exists: false,
				},
			});
		} else {
			ImportData.model.rawCollection().remove({});
		}
	}
}
