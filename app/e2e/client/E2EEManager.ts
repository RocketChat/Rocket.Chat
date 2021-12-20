import { Emitter } from '@rocket.chat/emitter';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';
import { EJSON } from 'meteor/ejson';

import { IMessage } from '../../../definition/IMessage';
import { IRoom } from '../../../definition/IRoom';
import { Subscriptions } from '../../models/client';
import { E2EERoomClient } from './E2EERoomClient';
import { ISubscription } from '../../../definition/ISubscription';
import { Notifications } from '../../notifications/client';
import { NotificationEvent } from '../../../definition/NotificationEvent';
import { decryptAES, deriveKey, encryptAES, importRawKey, joinVectorAndEncryptedData, splitVectorAndEncryptedData, toArrayBuffer, toString } from './helpers';
import { APIClient } from '../../utils/client/lib/RestApiClient';
import { E2EEKeyPair } from '../../../server/sdk/types/e2ee/E2EEKeyPair';

interface IE2EERoomClientPool {
	track(rid: IRoom['_id']): E2EERoomClient;
	untrack(rid: IRoom['_id']): void;
	untrackAll(): void;
}

class E2EERoomClientPool implements IE2EERoomClientPool {
	protected roomClients: Map<IRoom['_id'], E2EERoomClient> = new Map();

	// eslint-disable-next-line no-empty-function
	constructor(private userPrivateKey: CryptoKey) {}

	track(rid: IRoom['_id']): E2EERoomClient {
		const roomClient = this.roomClients.get(rid);

		if (roomClient) {
			return roomClient;
		}

		const newRoomClient = new E2EERoomClient(rid, this.userPrivateKey);
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

export class E2EEManager extends Emitter {
	private roomClients: IE2EERoomClientPool | undefined;

	protected started = false;

	protected enabled = new ReactiveVar(false);

	protected _ready = new ReactiveVar(false);

	protected failedToDecodeKey = false;

	protected dbPublicKey: string;

	protected dbPrivateKey: string;

	protected setPrivateKey(userPrivateKey: CryptoKey | undefined): void {
		if (!userPrivateKey) {
			return;
		}

		if (this.roomClients) {
			this.roomClients.untrackAll();
		}

		this.roomClients = new E2EERoomClientPool(userPrivateKey);
	}

	constructor() {
		super();

		this.on('ready', () => {
			this._ready.set(true);
		});
	}

	isEnabled(): boolean {
		return this.enabled.get();
	}

	setEnabled(enabled: boolean): void {
		this.enabled.set(enabled);
	}

	isReady(): boolean {
		return this.isEnabled() && this._ready.get();
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

	async decryptNotification(notification: NotificationEvent): Promise<NotificationEvent> {
		const roomClient = this.roomClients?.track(notification.payload.rid);
		const message = await roomClient?.decryptMessage({
			msg: notification.payload.message.msg,
			t: notification.payload.message.t,
			e2e: 'pending',
		}, { waitForKey: true });

		return {
			...notification,
			text: message?.msg ?? notification.text,
		};
	}

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

	use(keyPair: CryptoKeyPair): void {
		this.started = true;
		this.setPrivateKey(keyPair.privateKey);
		this.setEnabled(true);
		this._ready.set(true);
		this.requestSubscriptionKeys();
		this.emit('ready');
	}

	unuse(): void {
		this.started = false;
		this.setPrivateKey(undefined);
		this.setEnabled(false);
		this._ready.set(false);
	}

	async changePassword(newPassword: string): Promise<void> {
		const publicKey = Meteor._localStorage.getItem('public_key');
		const privateKey = Meteor._localStorage.getItem('private_key');

		if (!publicKey || !privateKey) {
			throw new Error();
		}

		await APIClient.v1.post<E2EEKeyPair, void>('e2e.setUserPublicAndPrivateKeys', {
			// eslint-disable-next-line @typescript-eslint/camelcase
			public_key: publicKey,
			// eslint-disable-next-line @typescript-eslint/camelcase
			private_key: await this.encodePrivateKey(privateKey, newPassword),
		});

		if (Meteor._localStorage.getItem('e2e.randomPassword')) {
			Meteor._localStorage.setItem('e2e.randomPassword', newPassword);
		}
	}

	async requestSubscriptionKeys(): Promise<void> {
		await APIClient.v1.post('e2e.requestSubscriptionKeys');
	}

	async getMasterKey(password: string): Promise<CryptoKey> {
		const baseKey = await importRawKey(toArrayBuffer(password));

		const uid = Meteor.userId();

		if (!uid) {
			throw new Error();
		}

		return deriveKey(toArrayBuffer(uid), baseKey);
	}

	async encodePrivateKey(privateKey: string, password: string): Promise<string> {
		const masterKey = await this.getMasterKey(password);

		const vector = crypto.getRandomValues(new Uint8Array(16));
		const encodedPrivateKey = await encryptAES(vector, masterKey, toArrayBuffer(privateKey));

		return EJSON.stringify(joinVectorAndEncryptedData(vector, encodedPrivateKey));
	}

	async decodePrivateKey(privateKey: string, password: string): Promise<string> {
		const masterKey = await this.getMasterKey(password);

		const [vector, cipherText] = splitVectorAndEncryptedData(EJSON.parse(privateKey) as Uint8Array);

		const privKey = await decryptAES(vector, masterKey, cipherText);
		return toString(privKey);
	}
}
