import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { ImportData } from '../models/ImportData';
import { IImportUser } from '../definitions/IImportUser';
import { IImportMessage } from '../definitions/IImportMessage';
import { IImportChannel } from '../definitions/IImportChannel';
import { Users, Rooms } from '../../../models/server';
import { generateUsernameSuggestion, insertMessage } from '../../../lib/server';

const guessNameFromUsername = (username: string) =>
	username
		.replace(/\W/g, ' ')
		.replace(/\s(.)/g, (u) => u.toUpperCase())
		.replace(/^(.)/, (u) => u.toLowerCase())
		.replace(/^\w/, (u) => u.toUpperCase());

export class ImporterBase {
	addObject(type: string, data: Record<string, any>): void {
		ImportData.insert({
			...data,
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

	updateUser(existingUser, userData: IImportUser): void {
		console.log('updating user', existingUser._id);

		// since we have an existing user, let's try a few things
		userData.id = existingUser._id;

		if (userData.importData?.id) {
			Users.update({
				_id: userData.id,
			}, {
				$addToSet: {
					importIds: userData.importData.id,
				},
			});
		}

		// this.saveNewId(userData._id, userData.id);
	}

	insertUser(userData: IImportUser): void {
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

			if (userData.importData?.id) {
				Users.update({ _id: userId }, { $addToSet: { importIds: userData.importData.id } });
			}

			userData.id = userId;
			// this.saveNewId(userData._id, userId);
		});
	}

	convertUsers(): void {
		const users = ImportData.find({ dataType: 'user' });
		users.forEach((u: IImportUser) => {
			try {
				if (!u.email) {
					throw new Error('importer-user-missing-email');
				}

				// if (!u.importData?.id) {
				// 	throw new Error('importer-user-missing-source-id');
				// }

				let existingUser = Users.findOneByEmailAddress(u.email);

				if (u.username) {
					// If we couldn't find one by their email address, try to find an existing user by their username
					if (!existingUser) {
						existingUser = Users.findOneByUsernameIgnoringCase(u.username);
					}
				} else {
					u.username = generateUsernameSuggestion({
						name: u.name,
						emails: [u.email],
					});
				}

				if (existingUser) {
					this.updateUser(existingUser, u);
				} else {
					if (!u.name) {
						u.name = guessNameFromUsername(u.username);
					}

					this.insertUser(u);
				}
			} catch (e) {
				this.saveError(u._id, e);
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
		messages.forEach((m) => {
			try {
				if (!m.ts || isNaN(m.ts)) {
					throw new Error('importer-message-invalid-timestamp');
				}

				const creator = this.findUser({
					_id: m.u?._id,
					username: m.u?.username,
					sourceId: m.importData?.u?._id,
					sourceUsername: m.importData?.u?.username,
				});

				if (!creator) {
					throw new Error('importer-message-unknown-user');
				}

				const room = this.findRoom({
					rid: m.rid,
					sourceRid: m.importData?.rid
				});

				if (!room) {
					throw new Error('importer-message-unknown-room');
				}

				const ts = m.ts.getTime();
				const sourceChannelId = m.importData?.rid || room._id;

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
				this.saveError(m._id, e);
				throw e;
			}
		});
	}

	updateRoom(room, roomData: IImportChannel): void {
		console.log('updating room', room._id);
		// eslint-disable-next-line no-extra-parens
		roomData.id = (roomData.name && roomData.name.toUpperCase() === 'GENERAL') ? 'GENERAL' : room._id;

		if (roomData.importData?.id) {
			Rooms.update({
				_id: roomData.id,
			}, {
				$addToSet: {
					importIds: roomData.importData.id,
				},
			});
		}

		// this.saveNewId(roomData._id, roomData.id);
	}

	findRoom({ rid, sourceRid }: Record<string, string | undefined>, returnId = false): string | IRoom | null {
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

	findRoomId({ rid, sourceRid }: Record<string, string | undefined>): string | null {
		return this.findRoom({ rid, sourceRid }, true) as string | null;
	}

	findUser({ _id, username, sourceId, sourceUsername }: Record<string, string | undefined>, returnId = false): string | IUser | null {
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
			// 	'importData.id': sourceId,
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

	findUserId({ _id, username, sourceId, sourceUsername }: Record<string, string | undefined>): string | null {
		return this.findUser({ _id, username, sourceId, sourceUsername }, true) as string | null;
	}

	insertRoom(roomData: IImportChannel, startedByUserId: string): void {
		// Find the rocketchatId of the user who created this channel
		const creatorId = this.findUserId({
			_id: roomData.u?._id,
			username: roomData.u?.username,
			sourceId: roomData.importData.u?._id,
			sourceUsername: roomData.importData.u?.username,
		}) || startedByUserId;

		console.log('insert room by', creatorId);

		// Create the channel
		Meteor.runAsUser(creatorId, () => {
			const roomInfo = roomData.t === 'd'
				? Meteor.call('createDirectMessage', ...roomData.users)
				: Meteor.call(roomData.t === 'p' ? 'createPrivateGroup' : 'createChannel', roomData.name, roomData.users);

			roomData.id = roomInfo.rid;
		});

		if (roomData.importData?.id) {
			Rooms.update({ _id: roomData.id }, { $addToSet: { importIds: roomData.importData.id } });
		}
		// this.saveNewId(roomData._id, roomData.id);
	}

	convertChannels(startedByUserId: string): void {
		const channels = ImportData.find({ dataType: 'channel' });
		channels.forEach((c) => {
			try {
				if (!c.name && c.t !== 'd') {
					throw new Error('importer-channel-missing-name');
				}

				// if (!c.importData?.id) {
				// 	throw new Error('importer-channel-missing-source-id');
				// }

				const existingRoom = c.t === 'd' ? Rooms.findDirectRoomContainingAllUsernames(c.users) : Rooms.findOneByNonValidatedName(c.name);
				// If the room exists or the name of it is 'general', then we don't need to create it again

				if (existingRoom || (c.name && c.name.toUpperCase() === 'GENERAL')) {
					this.updateRoom(existingRoom, c);
				} else {
					this.insertRoom(c, startedByUserId);
				}
			} catch (e) {
				this.saveError(c._id, e);
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
