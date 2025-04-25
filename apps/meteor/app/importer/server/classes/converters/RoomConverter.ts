import type { IImportChannel, IImportChannelRecord, IRoom } from '@rocket.chat/core-typings';
import { Subscriptions, Rooms, Users } from '@rocket.chat/models';
import { removeEmpty } from '@rocket.chat/tools';
import limax from 'limax';

import { RecordConverter } from './RecordConverter';
import { createDirectMessage } from '../../../../../server/methods/createDirectMessage';
import { saveRoomSettings } from '../../../../channel-settings/server/methods/saveRoomSettings';
import { notifyOnSubscriptionChangedByRoomId } from '../../../../lib/server/lib/notifyListener';
import { createChannelMethod } from '../../../../lib/server/methods/createChannel';
import { createPrivateGroupMethod } from '../../../../lib/server/methods/createPrivateGroup';
import type { IConversionCallbacks } from '../../definitions/IConversionCallbacks';

export class RoomConverter extends RecordConverter<IImportChannelRecord> {
	public startedByUserId: string;

	async convertChannels(startedByUserId: string, callbacks: IConversionCallbacks = {}): Promise<void> {
		this.startedByUserId = startedByUserId;

		return this.convertData(callbacks);
	}

	protected async convertRecord(record: IImportChannelRecord): Promise<boolean> {
		const { data } = record;

		if (!data.name && data.t !== 'd') {
			throw new Error('importer-channel-missing-name');
		}

		data.importIds = data.importIds.filter((item) => item);
		data.users = [...new Set(data.users)];

		if (!data.importIds.length) {
			throw new Error('importer-channel-missing-import-id');
		}

		const existingRoom = await this.findExistingRoom(data);
		await this.insertOrUpdateRoom(existingRoom, data, this.startedByUserId);

		return !existingRoom;
	}

	async insertOrUpdateRoom(existingRoom: IRoom | null, data: IImportChannel, startedByUserId: string): Promise<void> {
		if (existingRoom) {
			await this.updateRoom(existingRoom, data, startedByUserId);
		} else {
			await this.insertRoom(data, startedByUserId);
		}

		if (data.archived && data._id) {
			await this.archiveRoomById(data._id);
		}
	}

	async findExistingRoom(data: IImportChannel): Promise<IRoom | null> {
		if (data._id && data._id.toUpperCase() === 'GENERAL') {
			const room = await Rooms.findOneById('GENERAL', {});
			// Prevent the importer from trying to create a new general
			if (!room) {
				throw new Error('importer-channel-general-not-found');
			}

			return room;
		}

		if (data.t === 'd') {
			const users = await this._cache.convertImportedIdsToUsernames(data.users);
			if (users.length !== data.users.length) {
				throw new Error('importer-channel-missing-users');
			}

			return Rooms.findDirectRoomContainingAllUsernames(users, {});
		}

		if (!data.name) {
			return null;
		}

		// Imported room names always allow special chars
		const roomName = limax(data.name.trim(), { maintainCase: true });
		return Rooms.findOneByNonValidatedName(roomName, {});
	}

	async updateRoom(room: IRoom, roomData: IImportChannel, startedByUserId: string): Promise<void> {
		roomData._id = room._id;

		if ((roomData._id as string).toUpperCase() === 'GENERAL' && roomData.name !== room.name) {
			await saveRoomSettings(startedByUserId, 'GENERAL', 'roomName', roomData.name);
		}

		await this.updateRoomId(room._id, roomData);
	}

	async insertRoom(roomData: IImportChannel, startedByUserId: string): Promise<void> {
		// Find the rocketchatId of the user who created this channel
		const creatorId = await this.getRoomCreatorId(roomData, startedByUserId);
		const members = await this._cache.convertImportedIdsToUsernames(roomData.users, roomData.t !== 'd' ? creatorId : undefined);

		if (roomData.t === 'd') {
			if (members.length < roomData.users.length) {
				this._logger.warn(`One or more imported users not found: ${roomData.users}`);
				throw new Error('importer-channel-missing-users');
			}
		}

		// Create the channel
		try {
			let roomInfo;
			if (roomData.t === 'd') {
				roomInfo = await createDirectMessage(members, startedByUserId, true);
			} else {
				if (!roomData.name) {
					return;
				}
				if (roomData.t === 'p') {
					const user = await Users.findOneById(creatorId);
					if (!user) {
						throw new Error('importer-channel-invalid-creator');
					}
					roomInfo = await createPrivateGroupMethod(user, roomData.name, members, false, {}, {});
				} else {
					roomInfo = await createChannelMethod(creatorId, roomData.name, members, false, {}, {});
				}
			}

			roomData._id = roomInfo.rid;
		} catch (e) {
			this._logger.warn({ msg: 'Failed to create new room', name: roomData.name, members });
			this._logger.error(e);
			throw e;
		}

		await this.updateRoomId(roomData._id as 'string', roomData);
	}

	async archiveRoomById(rid: string) {
		const responses = await Promise.all([Rooms.archiveById(rid), Subscriptions.archiveByRoomId(rid)]);

		if (responses[1]?.modifiedCount) {
			void notifyOnSubscriptionChangedByRoomId(rid);
		}
	}

	async updateRoomId(_id: string, roomData: IImportChannel): Promise<void> {
		const set = {
			ts: roomData.ts,
			topic: roomData.topic,
			description: roomData.description,
		};

		const roomUpdate: { $set?: Record<string, any>; $addToSet?: Record<string, any> } = {};

		if (Object.keys(set).length > 0) {
			roomUpdate.$set = removeEmpty(set);
		}

		if (roomData.importIds.length) {
			roomUpdate.$addToSet = {
				importIds: {
					$each: roomData.importIds,
				},
			};
		}

		if (roomUpdate.$set || roomUpdate.$addToSet) {
			await Rooms.updateOne({ _id: roomData._id }, roomUpdate);
		}
	}

	async getRoomCreatorId(roomData: IImportChannel, startedByUserId: string): Promise<string> {
		if (roomData.u) {
			const creatorId = await this._cache.findImportedUserId(roomData.u._id);
			if (creatorId) {
				return creatorId;
			}

			if (roomData.t !== 'd') {
				return startedByUserId;
			}

			throw new Error('importer-channel-invalid-creator');
		}

		if (roomData.t === 'd') {
			for await (const member of roomData.users) {
				const userId = await this._cache.findImportedUserId(member);
				if (userId) {
					return userId;
				}
			}
		}

		throw new Error('importer-channel-invalid-creator');
	}

	protected getDataType(): 'channel' {
		return 'channel';
	}
}
