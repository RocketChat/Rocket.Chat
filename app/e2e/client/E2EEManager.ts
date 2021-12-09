import { Emitter } from '@rocket.chat/emitter';

import { IMessage } from '../../../definition/IMessage';
import { IRoom } from '../../../definition/IRoom';
import { Subscriptions } from '../../models/client';
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

	// eslint-disable-next-line no-empty-function
	constructor(private userPrivateKey: CryptoKey) {}

	track(rid: IRoom['_id']): E2ERoom {
		const roomClient = this.roomClients.get(rid);

		if (roomClient) {
			return roomClient;
		}

		const newRoomClient = new E2ERoom(rid, this.userPrivateKey);
		this.roomClients.set(rid, newRoomClient);
		newRoomClient.start();
		return newRoomClient;
	}

	untrack(rid: IRoom['_id']): void {
		this.roomClients.get(rid)?.stop();
		this.roomClients.delete(rid);
	}

	untrackAll(): void {
		for (const roomClient of this.roomClients.values()) {
			roomClient.stop();
		}
		this.roomClients.clear();
	}
}

export abstract class E2EEManager extends Emitter {
	private roomClients: IE2EERoomClientPool | undefined;

	private userPrivateKey: CryptoKey | undefined;

	protected get privateKey(): CryptoKey | undefined {
		return this.userPrivateKey;
	}

	protected set privateKey(userPrivateKey: CryptoKey | undefined) {
		this.userPrivateKey = userPrivateKey ?? undefined;

		if (!userPrivateKey) {
			return;
		}

		if (this.roomClients) {
			this.roomClients.untrackAll();
		}

		this.roomClients = new E2EERoomClientPool(userPrivateKey);
	}

	watchSubscriptions(): (() => void) {
		const subscriptionWatcher: Meteor.LiveQueryHandle = Subscriptions.find().observe({
			added: ({ rid }: ISubscription) => {
				this.roomClients?.track(rid);
			},
			removed: ({ rid }: ISubscription) => {
				this.roomClients?.untrack(rid);
			},
		});

		return (): void => {
			subscriptionWatcher.stop();
		};
	}

	watchKeyRequests(): (() => void) {
		const handleKeyRequest = (roomId: IRoom['_id'], keyId: string): void => {
			const roomClient = this.roomClients?.track(roomId);
			roomClient?.provideKeyToUser(keyId);
		};

		Notifications.onUser('e2e.keyRequest', handleKeyRequest);

		return (): void => {
			Notifications.unUser('e2e.keyRequest', handleKeyRequest);
		};
	}

	async decryptMessage(message: IMessage, { waitForKey = false }: { waitForKey?: boolean } = {}): Promise<IMessage> {
		const roomClient = this.roomClients?.track(message.rid);
		return roomClient?.decryptMessage(message, { waitForKey }) ?? message;
	}

	abstract toggle(enabled: boolean): void;

	abstract isReady(): boolean;

	async transformReceivedMessage(message: IMessage): Promise<IMessage> {
		try {
			const roomClient = this.roomClients?.track(message.rid);
			return roomClient?.decryptMessage(message) ?? message;
		} catch (error) {
			console.error(error);
			return message;
		}
	}

	async transformSendingMessage(message: IMessage): Promise<IMessage> {
		const roomClient = this.roomClients?.track(message.rid);
		return roomClient?.encryptMessage(message) ?? message;
	}
}
