import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import _ from 'underscore';

import { ImportData } from '../models/ImportData';
import { IImportUser } from '../definitions/IImportUser';
import { IImportMessage, IImportMessageReaction } from '../definitions/IImportMessage';
import { IImportChannel } from '../definitions/IImportChannel';
import { IImportUserRecord, IImportChannelRecord, IImportMessageRecord } from '../definitions/IImportRecord';
import { Users, Rooms } from '../../../models/server';
import { generateUsernameSuggestion, insertMessage, setUserAvatar } from '../../../lib/server';
import { setUserActiveStatus } from '../../../lib/server/functions/setUserActiveStatus';
import { IUser } from '../../../../definition/IUser';
import '../../../../definition/Meteor';

type IRoom = Record<string, any>;
type IMessage = Record<string, any>;
type IUserIdentification = {
	_id: string;
	username: string | undefined;
};
type IMentionedUser = {
	_id: string;
	username: string;
	name?: string;
};
type IMentionedChannel = {
	_id: string;
	name: string;
};

type IMessageReaction = {
	name: string;
	usernames: Array<string>;
};

type IMessageReactions = Record<string, IMessageReaction>;

const guessNameFromUsername = (username: string): string =>
	username
		.replace(/\W/g, ' ')
		.replace(/\s(.)/g, (u) => u.toUpperCase())
		.replace(/^(.)/, (u) => u.toLowerCase())
		.replace(/^\w/, (u) => u.toUpperCase());

export class ImporterBase {
	private _userCache: Map<string, IUserIdentification>;

	// display name uses a different cache because it's only used on mentions so we don't need to load it every time we load an user
	private _userDisplayNameCache: Map<string, string>;

	private _roomCache: Map<string, string>;

	private _roomNameCache: Map<string, string>;

	constructor() {
		this._userCache = new Map();
		this._userDisplayNameCache = new Map();
		this._roomCache = new Map();
		this._roomNameCache = new Map();
	}

	addUserToCache(importId: string, _id: string, username: string | undefined): IUserIdentification {
		const cache = {
			_id,
			username,
		};

		this._userCache.set(importId, cache);
		return cache;
	}

	addUserDisplayNameToCache(importId: string, name: string): string {
		this._userDisplayNameCache.set(importId, name);
		return name;
	}

	addRoomToCache(importId: string, rid: string): string {
		this._roomCache.set(importId, rid);
		return rid;
	}

	addRoomNameToCache(importId: string, name: string): string {
		this._roomNameCache.set(importId, name);
		return name;
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

	addObject(type: string, data: Record<string, any>, options: Record<string, any> = {}): void {
		ImportData.model.rawCollection().insert({
			data,
			dataType: type,
			...options,
		});
	}

	addUser(data: IImportUser): void {
		this.addObject('user', data);
	}

	addChannel(data: IImportChannel): void {
		this.addObject('channel', data);
	}

	addMessage(data: IImportMessage, useQuickInsert = false): void {
		this.addObject('message', data, {
			useQuickInsert: useQuickInsert || undefined,
		});
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
			// @ts-ignore
			joinDefaultChannelsSilenced: true,
		});

		userData._id = userId;
		const user = Users.findOneById(userId, {});

		if (user && userData.importIds.length) {
			this.addUserToCache(userData.importIds[0], user._id, userData.username);
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

	convertMessageReactions(importedReactions: Record<string, IImportMessageReaction>): undefined | IMessageReactions {
		const reactions: IMessageReactions = {};

		for (const name in importedReactions) {
			if (!importedReactions.hasOwnProperty(name)) {
				continue;
			}
			const { users } = importedReactions[name];

			if (!users.length) {
				continue;
			}

			const reaction: IMessageReaction = {
				name,
				usernames: [],
			};

			for (const importId of users) {
				const username = this.findImportedUsername(importId);
				if (username && !reaction.usernames.includes(username)) {
					reaction.usernames.push(username);
				}
			}

			if (reaction.usernames.length) {
				reactions[name] = reaction;
			}
		}

		if (Object.keys(reactions).length > 0) {
			return reactions;
		}
	}

	convertMessageReplies(replies: Array<string>): Array<string> {
		const result: Array<string> = [];
		for (const importId of replies) {
			const userId = this.findImportedUserId(importId);
			if (userId && !result.includes(userId)) {
				result.push(userId);
			}
		}
		return result;
	}

	convertMessageMentions(message: IImportMessage): Array<IMentionedUser> | undefined {
		const { mentions } = message;
		if (!mentions) {
			return undefined;
		}

		const result: Array<IMentionedUser> = [];
		for (const importId of mentions) {
			// eslint-disable-next-line no-extra-parens
			if (importId === ('all' as 'string') || importId === 'here') {
				result.push({
					_id: importId,
					username: importId,
				});
				continue;
			}

			// Loading the name will also store the remaining data on the cache if it's missing, so this won't run two queries
			const name = this.findImportedUserDisplayName(importId);
			const data = this.findImportedUser(importId);

			if (!data) {
				throw new Error('importer-message-mentioned-user-not-found');
			}
			if (!data.username) {
				throw new Error('importer-message-mentioned-username-not-found');
			}

			message.msg = message.msg.replace(new RegExp(`\@${ importId }`, 'gi'), `@${ data.username }`);

			result.push({
				_id: data._id,
				username: data.username as 'string',
				name,
			});
		}
		return result;
	}

	convertMessageChannels(message: IImportMessage): Array<IMentionedChannel> | undefined {
		const { channels } = message;
		if (!channels) {
			return;
		}

		const result: Array<IMentionedChannel> = [];
		for (const importId of channels) {
			// loading the name will also store the id on the cache if it's missing, so this won't run two queries
			const name = this.findImportedRoomName(importId);
			const _id = this.findImportedRoomId(importId);

			if (!_id || !name) {
				console.log(`Mentioned room not found: ${ importId }`);
				continue;
			}

			message.msg = message.msg.replace(new RegExp(`\#${ importId }`, 'gi'), `#${ name }`);

			result.push({
				_id,
				name,
			});
		}

		return result;
	}

	convertMessages(): void {
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

				// Convert the mentions and channels first because these conversions can also modify the msg in the message object
				const mentions = m.mentions && this.convertMessageMentions(m);
				const channels = m.channels && this.convertMessageChannels(m);

				const msgObj: IMessage = {
					rid,
					u: {
						_id: creator._id,
						username: creator.username,
					},
					msg: m.msg,
					ts: m.ts,
					t: m.t || undefined,
					groupable: m.groupable,
					tmid: m.tmid,
					tlm: m.tlm,
					tcount: m.tcount,
					replies: m.replies && this.convertMessageReplies(m.replies),
					editedAt: m.editedAt,
					editedBy: m.editedBy && (this.findImportedUser(m.editedBy) || undefined),
					mentions,
					channels,
					_importFile: m._importFile,
					url: m.url,
					attachments: m.attachments,
					bot: m.bot,
					emoji: m.emoji,
					alias: m.alias,
				};

				if (m._id) {
					msgObj._id = m._id;
				}

				if (m.reactions) {
					msgObj.reactions = this.convertMessageReactions(m.reactions);
				}

				insertMessage(creator, msgObj, rid, true);
			} catch (e) {
				this.saveError(_id, e);
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

	findImportedRoomName(importId: string): string | undefined {
		if (this._roomNameCache.has(importId)) {
			return this._roomNameCache.get(importId) as string;
		}

		const options = {
			fields: {
				_id: 1,
				name: 1,
			},
		};

		const room = Rooms.findOneByImportId(importId, options);
		if (room) {
			if (!this._roomCache.has(importId)) {
				this.addRoomToCache(importId, room._id);
			}
			return this.addRoomNameToCache(importId, room.name);
		}
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

	findImportedUsername(_id: string): string | undefined {
		const data = this.findImportedUser(_id);
		return data?.username;
	}

	findImportedUserDisplayName(importId: string): string | undefined {
		const options = {
			fields: {
				_id: 1,
				name: 1,
				username: 1,
			},
		};

		if (this._userDisplayNameCache.has(importId)) {
			return this._userDisplayNameCache.get(importId);
		}

		const user = importId === 'rocket.cat' ? Users.findOneById('rocket.cat', options) : Users.findOneByImportId(importId, options);
		if (user) {
			if (!this._userCache.has(importId)) {
				this.addUserToCache(importId, user._id, user.username);
			}

			return this.addUserDisplayNameToCache(importId, user.name);
		}
	}

	updateRoomId(_id: string, roomData: IImportChannel): void {
		const set = {
			ts: roomData.ts,
			topic: roomData.topic,
			description: roomData.description,
		};

		const roomUpdate: {$set?: Record<string, any>; $addToSet?: Record<string, any>} = {};

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

		this.updateRoomId(roomData._id as 'string', roomData);
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

		Meteor.defer(() => {
			this.clearSuccessfullyImportedData();
		});
	}

	clearImportData(): void {
		const rawCollection = ImportData.model.rawCollection();
		const remove = Meteor.wrapAsync(rawCollection.remove, rawCollection);

		remove({});
	}

	clearSuccessfullyImportedData(): void {
		ImportData.model.rawCollection().remove({
			errors: {
				$exists: false,
			},
		});
	}
}
