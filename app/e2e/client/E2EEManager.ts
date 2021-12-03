import { Emitter } from '@rocket.chat/emitter';
import { Meteor } from 'meteor/meteor';

import { waitUntilFind } from '../../../client/lib/utils/waitUntilFind';
import { IMessage } from '../../../definition/IMessage';
import { IRoom } from '../../../definition/IRoom';
import { Rooms } from '../../models/client';
import { E2ERoom } from './rocketchat.e2e.room';

export abstract class E2EEManager extends Emitter {
	protected roomClients: Map<IRoom['_id'], E2ERoom> = new Map();

	deleteRoomClient(rid: IRoom['_id']): void {
		this.roomClients.delete(rid);
	}

	clearRoomClients(): void {
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

		if (!this.roomClients.get(rid)) {
			this.roomClients.set(rid, new E2ERoom(Meteor.userId(), rid, room.t));
		}

		return this.roomClients.get(rid) ?? null;
	}

	/** @deprecated */
	removeInstanceByRoomId(rid: IRoom['_id']): void {
		this.deleteRoomClient(rid);
	}

	abstract decryptMessage(msg: IMessage): Promise<IMessage>;

	abstract toggle(enabled: boolean): void;

	abstract isReady(): boolean;

	async transformReceivedMessage(msg: IMessage): Promise<IMessage> {
		if (!this.isReady()) {
			throw new Error('E2EE not ready');
		}

		const e2eRoom = await this.getInstanceByRoomId(msg.rid);
		if (!e2eRoom || !e2eRoom.shouldConvertReceivedMessages()) {
			return msg;
		}

		return this.decryptMessage(msg);
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
		const msg = await e2eRoom.encrypt(message);

		message.msg = msg;
		message.t = 'e2e';
		message.e2e = 'pending';
		return message;
	}
}
