import { Emitter } from '@rocket.chat/emitter';
import { Meteor } from 'meteor/meteor';

import { waitUntilFind } from '../../../client/lib/utils/waitUntilFind';
import { IMessage } from '../../../definition/IMessage';
import { IRoom } from '../../../definition/IRoom';
import { Rooms } from '../../models/client';
import { checkSignal } from './helpers';
import { E2ERoom } from './rocketchat.e2e.room';

export abstract class E2EEManager extends Emitter {
	protected roomClients: Map<IRoom['_id'], E2ERoom> = new Map();

	getRoomClient(rid: IRoom['_id']): E2ERoom {
		const roomClient = this.roomClients.get(rid);

		if (roomClient) {
			return roomClient;
		}

		const newRoomClient = new E2ERoom(Meteor.userId(), rid);
		this.roomClients.set(rid, newRoomClient);
		return newRoomClient;
	}

	deleteRoomClient(rid: IRoom['_id']): void {
		this.roomClients.get(rid)?.emit('released');
		this.roomClients.delete(rid);
	}

	clearRoomClients(): void {
		for (const roomClient of this.roomClients.values()) {
			roomClient.emit('released');
		}
		this.roomClients.clear();
	}

	async getInstanceByRoomId(rid: IRoom['_id']): Promise<E2ERoom | null> {
		const room = await waitUntilFind(() => Rooms.findOne({ _id: rid }));

		if (room.t !== 'd' && room.t !== 'p') {
			return null;
		}

		if (room.encrypted !== true && !room.e2eKeyId) {
			return null;
		}

		const roomClient = this.roomClients.get(rid);

		if (roomClient) {
			return roomClient;
		}

		const newRoomClient = new E2ERoom(Meteor.userId(), rid);
		this.roomClients.set(rid, newRoomClient);
		return newRoomClient;
	}

	async decryptMessage(message: IMessage, signal?: AbortSignal): Promise<IMessage> {
		checkSignal(signal);

		const roomClient = this.getRoomClient(message.rid);

		await roomClient.whenCipherEnabled();

		checkSignal(signal);

		return roomClient?.decryptMessage(message) ?? message;
	}

	abstract toggle(enabled: boolean): void;

	abstract isReady(): boolean;

	async transformReceivedMessage(message: IMessage): Promise<IMessage> {
		try {
			if (!this.isReady()) {
				throw new Error('E2EE not ready');
			}

			const roomClient = this.getRoomClient(message.rid);

			await roomClient.whenCipherEnabled();

			if (!roomClient?.shouldConvertReceivedMessages()) {
				return message;
			}

			return roomClient.decryptMessage(message);
		} catch (error) {
			console.error(error);
			return message;
		}
	}

	async transformSendingMessage(message: IMessage): Promise<IMessage> {
		if (!this.isReady()) {
			throw new Error('E2EE not ready');
		}

		const e2eRoom = await this.getInstanceByRoomId(message.rid);

		if (!e2eRoom) {
			return message;
		}

		const subscription = await waitUntilFind(() => Rooms.findOne({ _id: message.rid }));

		subscription.encrypted ? e2eRoom.resume() : e2eRoom.pause();

		if (!await e2eRoom.shouldConvertSentMessages()) {
			return message;
		}

		// Should encrypt this message.
		return e2eRoom.encryptMessage(message);
	}
}
