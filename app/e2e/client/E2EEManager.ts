import { Emitter } from '@rocket.chat/emitter';

import { waitUntilFind } from '../../../client/lib/utils/waitUntilFind';
import { IMessage } from '../../../definition/IMessage';
import { IRoom } from '../../../definition/IRoom';
import { Rooms, Subscriptions } from '../../models/client';
import { checkSignal } from './helpers';
import { E2ERoom } from './rocketchat.e2e.room';
import { ISubscription } from '../../../definition/ISubscription';
import { Notifications } from '../../notifications/client';

interface IE2EERoomClientPool {
	track(rid: IRoom['_id']): E2ERoom;
	untrack(rid: IRoom['_id']): void;
	untrackAll(): void;
}

class E2EERoomClientPool implements IE2EERoomClientPool {
	protected roomClients: Map<IRoom['_id'], E2ERoom> = new Map();

	track(rid: IRoom['_id']): E2ERoom {
		const roomClient = this.roomClients.get(rid);

		if (roomClient) {
			return roomClient;
		}

		const newRoomClient = new E2ERoom(rid);
		this.roomClients.set(rid, newRoomClient);
		return newRoomClient;
	}

	untrack(rid: IRoom['_id']): void {
		this.roomClients.get(rid)?.release();
		this.roomClients.delete(rid);
	}

	untrackAll(): void {
		for (const roomClient of this.roomClients.values()) {
			roomClient.release();
		}
		this.roomClients.clear();
	}
}

export abstract class E2EEManager extends Emitter {
	private roomClients = new E2EERoomClientPool();

	watchSubscriptions(): (() => void) {
		const subscriptionWatcher: Meteor.LiveQueryHandle = Subscriptions.find().observe({
			added: ({ rid }: ISubscription) => {
				this.roomClients.track(rid);
			},
			removed: ({ rid }: ISubscription) => {
				this.roomClients.untrack(rid);
			},
		});

		return (): void => {
			subscriptionWatcher.stop();
		};
	}

	watchKeyRequests(): (() => void) {
		const handleKeyRequest = (roomId: IRoom['_id'], keyId: string): void => {
			const roomClient = this.roomClients.track(roomId);
			roomClient.provideKeyToUser(keyId);
		};

		Notifications.onUser('e2e.keyRequest', handleKeyRequest);

		return (): void => {
			Notifications.unUser('e2e.keyRequest', handleKeyRequest);
		};
	}

	async decryptMessage(message: IMessage, signal?: AbortSignal): Promise<IMessage> {
		checkSignal(signal);

		const roomClient = this.roomClients.track(message.rid);

		await roomClient.whenReady();

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

			const roomClient = this.roomClients.track(message.rid);

			await roomClient.whenReady();

			if (!roomClient.shouldConvertReceivedMessages()) {
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

		const roomClient = this.roomClients.track(message.rid);

		await roomClient.whenReady();

		const subscription = await waitUntilFind(() => Rooms.findOne({ _id: message.rid }));

		subscription.encrypted ? roomClient.resume() : roomClient.pause();

		if (!await roomClient.shouldConvertSentMessages()) {
			return message;
		}

		// Should encrypt this message.
		return roomClient.encryptMessage(message);
	}
}
