import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { ImportData } from '../models/ImportData';
import { IImportUser, IImportUserIdentification } from '../definitions/IImportUser';
import { IImportMessage, IImportMessageIdentification } from '../definitions/IImportMessage';
import { IImportChannel, IImportChannelIdentification } from '../definitions/IImportChannel';
import { IImportUserRecord, IImportChannelRecord, IImportMessageRecord } from '../definitions/IImportRecord';
import { Users, Rooms } from '../../../models/server';
import { generateUsernameSuggestion, insertMessage } from '../../../lib/server';
import { IUser } from '../../../../definition/IUser';
import '../../../../definition/Meteor';

type IRoom = Record<string, any>;

const guessNameFromUsername = (username: string): string =>
	username
		.replace(/\W/g, ' ')
		.replace(/\s(.)/g, (u) => u.toUpperCase())
		.replace(/^(.)/, (u) => u.toLowerCase())
		.replace(/^\w/, (u) => u.toUpperCase());

export class ImporterBase {
	addObject(type: string, identification: Record<string, any>, data: Record<string, any>): void {
		ImportData.insert({
			data,
			identification,
			dataType: type,
		});
	}

	addUser(identification: IImportUserIdentification, data: IImportUser): void {
		this.addObject('user', identification, data);
	}

	addChannel(identification: IImportChannelIdentification, data: IImportChannel): void {
		this.addObject('channel', identification, data);
	}

	addMessage(identification: IImportMessageIdentification, data: IImportMessage): void {
		this.addObject('message', identification, data);
	}

	updateUser(existingUser: IUser, userData: IImportUser, identification: IImportUserIdentification): void {
		console.log('updating user', existingUser._id);

		// since we have an existing user, let's try a few things
		userData.id = existingUser._id;

		if (identification?.id) {
			Users.update({
				_id: userData.id,
			}, {
				$addToSet: {
					importIds: identification.id,
				},
			});
		}

		// this.saveNewId(userData._id, userData.id);
	}

	insertUser(userData: IImportUser, identification: IImportUserIdentification): void {
		console.log('insert user', userData);

		const password = `${ Date.now() }${ userData.name || '' }${ userData.email.toUpperCase() }`;
		const userId = Accounts.createUser({
			email: userData.email,
			password,
		});

		Meteor.runAsUser(userId, () => {
			Meteor.call('setUsername', userData.username, { joinDefaultChannelsSilenced: true });
			if (userData.name) {
				Users.setName(userId, userData.name);
			}

			if (identification?.id) {
				Users.update({ _id: userId }, { $addToSet: { importIds: identification.id } });
			}

			userData.id = userId;
			// this.saveNewId(userData._id, userId);
		});
	}

	convertUsers(): void {
		const users = ImportData.find({ dataType: 'user' });
		users.forEach(({ data, identification, _id }: IImportUserRecord) => {
			try {
				if (!data.email) {
					throw new Error('importer-user-missing-email');
				}

				// if (!identification?.id) {
				// 	throw new Error('importer-user-missing-source-id');
				// }

				let existingUser = Users.findOneByEmailAddress(data.email, {});

				if (data.username) {
					// If we couldn't find one by their email address, try to find an existing user by their username
					if (!existingUser) {
						existingUser = Users.findOneByUsernameIgnoringCase(data.username, {});
					}
				} else {
					data.username = generateUsernameSuggestion({
						name: data.name,
						emails: [data.email],
					});
				}

				if (existingUser) {
					this.updateUser(existingUser, data, identification);
				} else {
					if (!data.name && data.username) {
						data.name = guessNameFromUsername(data.username);
					}

					this.insertUser(data, identification);
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

		const timestamps: Record<number, number> = {};
		const messages = ImportData.find({ dataType: 'message' });
		messages.forEach(({ data: m, identification, _id }: IImportMessageRecord) => {
			try {
				if (!m.ts || isNaN(m.ts as unknown as number)) {
					throw new Error('importer-message-invalid-timestamp');
				}

				const creator = this.findUser({
					_id: m.u?._id,
					username: m.u?.username,
					sourceId: identification?.u?._id,
					sourceUsername: identification?.u?.username,
				});

				if (!creator) {
					throw new Error('importer-message-unknown-user');
				}

				const room = this.findRoom({
					rid: m.rid,
					sourceRid: identification?.rid,
				});

				if (!room) {
					throw new Error('importer-message-unknown-room');
				}

				const ts = m.ts.getTime();
				const sourceChannelId = identification?.rid || room._id;

				let suffix = '';
				if (timestamps[ts] === undefined) {
					timestamps[ts] = 1;
				} else {
					suffix = `-${ timestamps[ts] }`;
					timestamps[ts] += 1;
				}

				const msgObj = {
					// _id: `csv-${ csvChannel.id }-${ msg.ts }${ suffix }`,
					_id: `imported-${ sourceChannelId }-${ ts }${ suffix }`,
					ts: m.ts,
					msg: m.msg,
					rid: room._id,
					u: {
						_id: creator._id,
						username: creator.username,
					},
				};

				insertMessage(creator, msgObj, room, true);
			} catch (e) {
				this.saveError(_id, e);
				throw e;
			}
		});
	}

	updateRoom(room: IRoom, roomData: IImportChannel, identification: IImportChannelIdentification): void {
		console.log('updating room', room._id);
		// eslint-disable-next-line no-extra-parens
		roomData.id = (roomData.name && roomData.name.toUpperCase() === 'GENERAL') ? 'GENERAL' : room._id;

		if (identification?.id) {
			Rooms.update({
				_id: roomData.id,
			}, {
				$addToSet: {
					importIds: identification.id,
				},
			});
		}

		// this.saveNewId(roomData._id, roomData.id);
	}

	_findRoom({ rid, sourceRid }: Record<string, string | undefined>, returnId = false): string | IRoom | null {
		const options = returnId ? { fields: { _id: 1 } } : undefined;

		if (rid) {
			if (returnId) {
				return rid;
			}

			return Rooms.findOneById(rid, options);
		}

		if (sourceRid) {
			const room = Rooms.findOneByImportId(sourceRid, options);

			if (room) {
				if (returnId) {
					return room._id;
				}

				return room;
			}
		}

		return null;
	}

	findRoom({ rid, sourceRid }: Record<string, string | undefined>): IRoom | null {
		return this._findRoom({ rid, sourceRid }, false) as IRoom | null;
	}

	findRoomId({ rid, sourceRid }: Record<string, string | undefined>): string | null {
		return this._findRoom({ rid, sourceRid }, true) as string | null;
	}

	_findUser({ _id, username, sourceId, sourceUsername }: Record<string, string | undefined>, returnId = false): string | IUser | null {
		const options = returnId ? { fields: { _id: 1 } } : undefined;

		if (_id) {
			if (returnId) {
				return _id;
			}

			return Users.findOneById(_id, options);
		}

		if (username) {
			const user = Users.findOneByUsernameIgnoringCase(username, options);
			if (user) {
				if (returnId) {
					return user._id;
				}

				return user;
			}
		}

		if (sourceId) {
			const user = Users.findOneByImportId(sourceId, options);
			if (user) {
				if (returnId) {
					return user._id;
				}
				return user;
			}

			// const userImport = ImportData.findOne({
			// 	dataType: 'user',
			// 	'identification.id': sourceId,
			// 	id: {
			// 		$exists: true,
			// 	},
			// }, { fields: { id: 1 } });

			// if (userImport && userImport.id) {
			// 	if (returnId) {
			// 		return userImport.id;
			// 	}

			// 	return Users.findOneById(userImport.id, options);
			// }
		}

		if (sourceUsername) {
			// const userImport = ImportData.findOne({
			// 	dataType: 'user',
			// 	username: sourceUsername,
			// 	id: {
			// 		$exists: true,
			// 	},
			// }, { fields: { id: 1 } });

			// if (userImport && userImport.id) {
			// 	if (userImport && userImport.id) {
			// 		if (returnId) {
			// 			return userImport.id;
			// 		}

			// 		return Users.findOneById(userImport.id, options);
			// 	}
			// }

			const user = Users.findOneByUsernameIgnoringCase(sourceUsername, options);
			if (user) {
				if (returnId) {
					return user._id;
				}
				return user;
			}
		}

		return null;
	}

	findUser({ _id, username, sourceId, sourceUsername }: Record<string, string | undefined>): IUser | null {
		return this._findUser({ _id, username, sourceId, sourceUsername }, false) as IUser | null;
	}

	findUserId({ _id, username, sourceId, sourceUsername }: Record<string, string | undefined>): string | null {
		return this._findUser({ _id, username, sourceId, sourceUsername }, true) as string | null;
	}

	insertRoom(roomData: IImportChannel, identification: IImportChannelIdentification, startedByUserId: string): void {
		// Find the rocketchatId of the user who created this channel
		const creatorId = this.findUserId({
			_id: roomData.u?._id,
			username: roomData.u?.username,
			sourceId: identification.u?._id,
			sourceUsername: identification.u?.username,
		}) || startedByUserId;

		console.log('insert room by', creatorId);

		// Create the channel
		Meteor.runAsUser(creatorId, () => {
			const roomInfo = roomData.t === 'd'
				? Meteor.call('createDirectMessage', ...roomData.users)
				: Meteor.call(roomData.t === 'p' ? 'createPrivateGroup' : 'createChannel', roomData.name, roomData.users);

			roomData.id = roomInfo.rid;
		});

		if (identification?.id) {
			Rooms.update({ _id: roomData.id }, { $addToSet: { importIds: identification.id } });
		}
		// this.saveNewId(roomData._id, roomData.id);
	}

	convertChannels(startedByUserId: string): void {
		const channels = ImportData.find({ dataType: 'channel' });
		channels.forEach(({ data: c, identification, _id }: IImportChannelRecord) => {
			try {
				if (!c.name && c.t !== 'd') {
					throw new Error('importer-channel-missing-name');
				}

				// if (!c.identification?.id) {
				// 	throw new Error('importer-channel-missing-source-id');
				// }

				const existingRoom = c.t === 'd' ? Rooms.findDirectRoomContainingAllUsernames(c.users, {}) : Rooms.findOneByNonValidatedName(c.name, {});
				// If the room exists or the name of it is 'general', then we don't need to create it again

				if (existingRoom || (c.name && c.name.toUpperCase() === 'GENERAL')) {
					this.updateRoom(existingRoom, c, identification);
				} else {
					this.insertRoom(c, identification, startedByUserId);
				}
			} catch (e) {
				this.saveError(_id, e);
			}
		});
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
