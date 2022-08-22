import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import _ from 'underscore';
import { ObjectId } from 'mongodb';
import type {
	IImportUser,
	IImportMessage,
	IImportMessageReaction,
	IImportChannel,
	IImportUserRecord,
	IImportChannelRecord,
	IImportMessageRecord,
	IUser,
	IUserEmail,
} from '@rocket.chat/core-typings';
import { ImportData as ImportDataRaw } from '@rocket.chat/models';

import type { IConversionCallbacks } from '../definitions/IConversionCallbacks';
import { Users, Rooms, Subscriptions, ImportData } from '../../../models/server';
import { generateUsernameSuggestion, insertMessage, saveUserIdentity, addUserToDefaultChannels } from '../../../lib/server';
import { setUserActiveStatus } from '../../../lib/server/functions/setUserActiveStatus';
import type { Logger } from '../../../../server/lib/logger/Logger';

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

export type IConverterOptions = {
	flagEmailsAsVerified?: boolean;
	skipExistingUsers?: boolean;
};

const guessNameFromUsername = (username: string): string =>
	username
		.replace(/\W/g, ' ')
		.replace(/\s(.)/g, (u) => u.toUpperCase())
		.replace(/^(.)/, (u) => u.toLowerCase())
		.replace(/^\w/, (u) => u.toUpperCase());

export class ImportDataConverter {
	private _userCache: Map<string, IUserIdentification>;

	// display name uses a different cache because it's only used on mentions so we don't need to load it every time we load an user
	private _userDisplayNameCache: Map<string, string>;

	private _roomCache: Map<string, string>;

	private _roomNameCache: Map<string, string>;

	private _logger: Logger;

	private _options: IConverterOptions;

	public get options(): IConverterOptions {
		return this._options;
	}

	constructor(options?: IConverterOptions) {
		this._options = options || {
			flagEmailsAsVerified: false,
			skipExistingUsers: false,
		};
		this._userCache = new Map();
		this._userDisplayNameCache = new Map();
		this._roomCache = new Map();
		this._roomNameCache = new Map();
	}

	setLogger(logger: Logger): void {
		this._logger = logger;
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

	protected addObject(type: string, data: Record<string, any>, options: Record<string, any> = {}): void {
		ImportData.model.rawCollection().insert({
			_id: new ObjectId().toHexString(),
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

	addUserImportId(updateData: Record<string, any>, userData: IImportUser): void {
		if (userData.importIds?.length) {
			updateData.$addToSet = {
				importIds: {
					$each: userData.importIds,
				},
			};
		}
	}

	addUserEmails(updateData: Record<string, any>, userData: IImportUser, existingEmails: Array<IUserEmail>): void {
		if (!userData.emails?.length) {
			return;
		}

		const verifyEmails = Boolean(this.options.flagEmailsAsVerified);
		const newEmailList: Array<IUserEmail> = [];

		for (const email of userData.emails) {
			const verified = verifyEmails || existingEmails.find((ee) => ee.address === email)?.verified || false;

			newEmailList.push({
				address: email,
				verified,
			});
		}

		updateData.$set.emails = newEmailList;
	}

	addUserServices(updateData: Record<string, any>, userData: IImportUser): void {
		if (!userData.services) {
			return;
		}

		for (const serviceKey in userData.services) {
			if (!userData.services[serviceKey]) {
				continue;
			}

			const service = userData.services[serviceKey];

			for (const key in service) {
				if (!service[key]) {
					continue;
				}

				updateData.$set[`services.${serviceKey}.${key}`] = service[key];
			}
		}
	}

	addCustomFields(updateData: Record<string, any>, userData: IImportUser): void {
		if (!userData.customFields) {
			return;
		}

		const subset = (source: Record<string, any>, currentPath: string): void => {
			for (const key in source) {
				if (!source.hasOwnProperty(key)) {
					continue;
				}

				const keyPath = `${currentPath}.${key}`;
				if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
					subset(source[key], keyPath);
					continue;
				}

				updateData.$set[keyPath] = source[key];
			}
		};

		subset(userData.customFields, 'customFields');
	}

	updateUser(existingUser: IUser, userData: IImportUser): void {
		const { _id } = existingUser;

		userData._id = _id;

		if (!userData.roles && !existingUser.roles) {
			userData.roles = ['user'];
		}
		if (!userData.type && !existingUser.type) {
			userData.type = 'user';
		}

		// #ToDo: #TODO: Move this to the model class
		const updateData: Record<string, any> = {
			$set: {
				...(userData.roles && { roles: userData.roles }),
				...(userData.type && { type: userData.type }),
				...(userData.statusText && { statusText: userData.statusText }),
				...(userData.bio && { bio: userData.bio }),
				...(userData.services?.ldap && { ldap: true }),
				...(userData.avatarUrl && { _pendingAvatarUrl: userData.avatarUrl }),
			},
		};

		this.addCustomFields(updateData, userData);
		this.addUserServices(updateData, userData);
		this.addUserImportId(updateData, userData);
		this.addUserEmails(updateData, userData, existingUser.emails || []);

		if (Object.keys(updateData.$set).length === 0) {
			delete updateData.$set;
		}
		if (Object.keys(updateData).length > 0) {
			Users.update({ _id }, updateData);
		}

		if (userData.utcOffset) {
			Users.setUtcOffset(_id, userData.utcOffset);
		}

		if (userData.name || userData.username) {
			saveUserIdentity({ _id, name: userData.name, username: userData.username } as Parameters<typeof saveUserIdentity>[0]);
		}

		if (userData.importIds.length) {
			this.addUserToCache(userData.importIds[0], existingUser._id, existingUser.username || userData.username);
		}
	}

	insertUser(userData: IImportUser): IUser {
		const password = `${Date.now()}${userData.name || ''}${userData.emails.length ? userData.emails[0].toUpperCase() : ''}`;
		const userId = userData.emails.length
			? Accounts.createUser({
					email: userData.emails[0],
					password,
			  })
			: Accounts.createUser({
					username: userData.username,
					password,
					joinDefaultChannelsSilenced: true,
			  });

		const user = Users.findOneById(userId, {});
		this.updateUser(user, userData);

		addUserToDefaultChannels(user, true);
		return user;
	}

	protected async getUsersToImport(): Promise<Array<IImportUserRecord>> {
		return ImportDataRaw.getAllUsers().toArray();
	}

	findExistingUser(data: IImportUser): IUser | undefined {
		if (data.emails.length) {
			const emailUser = Users.findOneByEmailAddress(data.emails[0], {});

			if (emailUser) {
				return emailUser;
			}
		}

		// If we couldn't find one by their email address, try to find an existing user by their username
		if (data.username) {
			return Users.findOneByUsernameIgnoringCase(data.username, {});
		}
	}

	public convertUsers({ beforeImportFn, afterImportFn }: IConversionCallbacks = {}): void {
		const users = Promise.await(this.getUsersToImport()) as IImportUserRecord[];
		users.forEach(({ data, _id }) => {
			try {
				if (beforeImportFn && !beforeImportFn(data, 'user')) {
					this.skipRecord(_id);
					return;
				}

				const emails = data.emails.filter(Boolean).map((email) => ({ address: email }));
				data.importIds = data.importIds.filter((item) => item);

				if (!data.emails.length && !data.username) {
					throw new Error('importer-user-missing-email-and-username');
				}

				let existingUser = this.findExistingUser(data);
				if (existingUser && this._options.skipExistingUsers) {
					this.skipRecord(_id);
					return;
				}

				if (!data.username) {
					data.username = generateUsernameSuggestion({
						name: data.name,
						emails,
					});
				}

				const isNewUser = !existingUser;

				if (existingUser) {
					this.updateUser(existingUser, data);
				} else {
					if (!data.name && data.username) {
						data.name = guessNameFromUsername(data.username);
					}

					existingUser = this.insertUser(data);
				}

				// Deleted users are 'inactive' users in Rocket.Chat
				// TODO: Check data._id if exists/required or not
				if (data.deleted && existingUser?.active) {
					data._id && setUserActiveStatus(data._id, false, true);
				} else if (data.deleted === false && existingUser?.active === false) {
					data._id && setUserActiveStatus(data._id, true);
				}

				if (afterImportFn) {
					afterImportFn(data, 'user', isNewUser);
				}
			} catch (e) {
				this._logger.error(e);
				this.saveError(_id, e instanceof Error ? e : new Error(String(e)));
			}
		});
	}

	protected saveError(importId: string, error: Error): void {
		this._logger.error(error);
		ImportData.update(
			{
				_id: importId,
			},
			{
				$push: {
					errors: {
						message: error.message,
						stack: error.stack,
					},
				},
			},
		);
	}

	protected skipRecord(_id: string): void {
		ImportData.update(
			{
				_id,
			},
			{
				$set: {
					skipped: true,
				},
			},
		);
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
				this._logger.warn(`Mentioned user not found: ${importId}`);
				continue;
			}

			if (!data.username) {
				this._logger.debug(importId);
				throw new Error('importer-message-mentioned-username-not-found');
			}

			message.msg = message.msg.replace(new RegExp(`\@${importId}`, 'gi'), `@${data.username}`);

			result.push({
				_id: data._id,
				username: data.username as 'string',
				name,
			});
		}
		return result;
	}

	getMentionedChannelData(importId: string): IMentionedChannel | undefined {
		// loading the name will also store the id on the cache if it's missing, so this won't run two queries
		const name = this.findImportedRoomName(importId);
		const _id = this.findImportedRoomId(importId);

		if (name && _id) {
			return {
				name,
				_id,
			};
		}

		// If the importId was not found, check if we have a room with that name
		const room = Rooms.findOneByNonValidatedName(importId, { fields: { name: 1 } });
		if (room) {
			this.addRoomToCache(importId, room._id);
			this.addRoomNameToCache(importId, room.name);

			return {
				name: room.name,
				_id: room._id,
			};
		}
	}

	convertMessageChannels(message: IImportMessage): Array<IMentionedChannel> | undefined {
		const { channels } = message;
		if (!channels) {
			return;
		}

		const result: Array<IMentionedChannel> = [];
		for (const importId of channels) {
			const { name, _id } = this.getMentionedChannelData(importId) || {};

			if (!_id || !name) {
				this._logger.warn(`Mentioned room not found: ${importId}`);
				continue;
			}

			message.msg = message.msg.replace(new RegExp(`\#${importId}`, 'gi'), `#${name}`);

			result.push({
				_id,
				name,
			});
		}

		return result;
	}

	protected async getMessagesToImport(): Promise<Array<IImportMessageRecord>> {
		return ImportDataRaw.getAllMessages().toArray();
	}

	convertMessages({ beforeImportFn, afterImportFn }: IConversionCallbacks = {}): void {
		const rids: Array<string> = [];
		const messages = Promise.await(this.getMessagesToImport());
		messages.forEach(({ data, _id }: IImportMessageRecord) => {
			try {
				if (beforeImportFn && !beforeImportFn(data, 'message')) {
					this.skipRecord(_id);
					return;
				}

				if (!data.ts || isNaN(data.ts as unknown as number)) {
					throw new Error('importer-message-invalid-timestamp');
				}

				const creator = this.findImportedUser(data.u._id);
				if (!creator) {
					this._logger.warn(`Imported user not found: ${data.u._id}`);
					throw new Error('importer-message-unknown-user');
				}

				const rid = this.findImportedRoomId(data.rid);
				if (!rid) {
					throw new Error('importer-message-unknown-room');
				}
				if (!rids.includes(rid)) {
					rids.push(rid);
				}

				// Convert the mentions and channels first because these conversions can also modify the msg in the message object
				const mentions = data.mentions && this.convertMessageMentions(data);
				const channels = data.channels && this.convertMessageChannels(data);

				const msgObj: IMessage = {
					rid,
					u: {
						_id: creator._id,
						username: creator.username,
					},
					msg: data.msg,
					ts: data.ts,
					t: data.t || undefined,
					groupable: data.groupable,
					tmid: data.tmid,
					tlm: data.tlm,
					tcount: data.tcount,
					replies: data.replies && this.convertMessageReplies(data.replies),
					editedAt: data.editedAt,
					editedBy: data.editedBy && (this.findImportedUser(data.editedBy) || undefined),
					mentions,
					channels,
					_importFile: data._importFile,
					url: data.url,
					attachments: data.attachments,
					bot: data.bot,
					emoji: data.emoji,
					alias: data.alias,
				};

				if (data._id) {
					msgObj._id = data._id;
				}

				if (data.reactions) {
					msgObj.reactions = this.convertMessageReactions(data.reactions);
				}

				try {
					insertMessage(creator, msgObj, rid, true);
				} catch (e) {
					this._logger.warn(`Failed to import message with timestamp ${String(msgObj.ts)} to room ${rid}`);
					this._logger.error(e);
				}

				if (afterImportFn) {
					afterImportFn(data, 'message', true);
				}
			} catch (e) {
				this.saveError(_id, e instanceof Error ? e : new Error(String(e)));
			}
		});

		for (const rid of rids) {
			try {
				Rooms.resetLastMessageById(rid);
			} catch (e) {
				this._logger.warn(`Failed to update last message of room ${rid}`);
				this._logger.error(e);
			}
		}
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

	public findDMForImportedUsers(...users: Array<string>): IImportChannel | undefined {
		const record = ImportData.findDMForImportedUsers(...users);
		if (record) {
			return record.data;
		}
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

		const roomUpdate: { $set?: Record<string, any>; $addToSet?: Record<string, any> } = {};

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
				this._logger.warn(`One or more imported users not found: ${roomData.users}`);
				throw new Error('importer-channel-missing-users');
			}
		}

		// Create the channel
		try {
			Meteor.runAsUser(creatorId, () => {
				const roomInfo =
					roomData.t === 'd'
						? Meteor.call('createDirectMessage', ...members)
						: Meteor.call(roomData.t === 'p' ? 'createPrivateGroup' : 'createChannel', roomData.name, members);

				roomData._id = roomInfo.rid;
			});
		} catch (e) {
			this._logger.warn({ msg: 'Failed to create new room', name: roomData.name, members });
			this._logger.error(e);
			throw e;
		}

		this.updateRoomId(roomData._id as 'string', roomData);
	}

	convertImportedIdsToUsernames(importedIds: Array<string>, idToRemove: string | undefined = undefined): Array<string> {
		return importedIds
			.map((user) => {
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
			})
			.filter((user) => user);
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

	protected async getChannelsToImport(): Promise<Array<IImportChannelRecord>> {
		return ImportDataRaw.getAllChannels().toArray();
	}

	convertChannels(startedByUserId: string, { beforeImportFn, afterImportFn }: IConversionCallbacks = {}): void {
		const channels = Promise.await(this.getChannelsToImport());
		channels.forEach(({ data, _id }: IImportChannelRecord) => {
			try {
				if (beforeImportFn && !beforeImportFn(data, 'channel')) {
					this.skipRecord(_id);
					return;
				}

				if (!data.name && data.t !== 'd') {
					throw new Error('importer-channel-missing-name');
				}

				data.importIds = data.importIds.filter((item) => item);
				data.users = _.uniq(data.users);

				if (!data.importIds.length) {
					throw new Error('importer-channel-missing-import-id');
				}

				const existingRoom = this.findExistingRoom(data);

				if (existingRoom) {
					this.updateRoom(existingRoom, data, startedByUserId);
				} else {
					this.insertRoom(data, startedByUserId);
				}

				if (data.archived && data._id) {
					this.archiveRoomById(data._id);
				}

				if (afterImportFn) {
					afterImportFn(data, 'channel', !existingRoom);
				}
			} catch (e) {
				this.saveError(_id, e instanceof Error ? e : new Error(String(e)));
			}
		});
	}

	archiveRoomById(rid: string): void {
		Rooms.archiveById(rid);
		Subscriptions.archiveByRoomId(rid);
	}

	convertData(startedByUserId: string, callbacks: IConversionCallbacks = {}): void {
		this.convertUsers(callbacks);
		this.convertChannels(startedByUserId, callbacks);
		this.convertMessages(callbacks);

		Meteor.defer(() => {
			this.clearSuccessfullyImportedData();
		});
	}

	public clearImportData(): void {
		// Using raw collection since its faster
		Promise.await(ImportData.model.rawCollection().remove({}));
	}

	clearSuccessfullyImportedData(): void {
		ImportData.model.rawCollection().remove({
			errors: {
				$exists: false,
			},
		});
	}
}
