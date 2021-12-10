import { Emitter } from '@rocket.chat/emitter';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Meteor } from 'meteor/meteor';
import { EJSON } from 'meteor/ejson';
import { Random } from 'meteor/random';

import { IMessage } from '../../../definition/IMessage';
import { IRoom } from '../../../definition/IRoom';
import { Subscriptions } from '../../models/client';
import { E2EERoomClient } from './E2EERoomClient';
import { ISubscription } from '../../../definition/ISubscription';
import { Notifications } from '../../notifications/client';
import { NotificationEvent } from '../../../definition/NotificationEvent';
import * as banners from '../../../client/lib/banners';
import { imperativeModal } from '../../../client/lib/imperativeModal';
import SaveE2EEPasswordModal from '../../../client/views/e2ee/SaveE2EEPasswordModal';
import EnterE2EEPasswordModal from '../../../client/views/e2ee/EnterE2EEPasswordModal';
import { decryptAES, deriveKey, encryptAES, exportJWKKey, generateRSAKey, importRawKey, importRSAKey, joinVectorAndEncryptedData, splitVectorAndEncryptedData, toArrayBuffer, toString } from './helpers';
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

	private userPrivateKey: CryptoKey | undefined;

	protected started = false;

	protected enabled = new ReactiveVar(false);

	protected _ready = new ReactiveVar(false);

	protected failedToDecodeKey = false;

	protected dbPublicKey: string;

	protected dbPrivateKey: string;

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

	toggle(enabled: boolean): void {
		if (enabled) {
			this.startClient();
			this.setEnabled(true);
			return;
		}

		this.setEnabled(false);
		this.closeAlert();
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

	async startClient(): Promise<void> {
		if (this.started) {
			return;
		}

		console.log('startClient -> STARTED');

		this.started = true;
		let publicKey = Meteor._localStorage.getItem('public_key');
		let privateKey = Meteor._localStorage.getItem('private_key');

		await this.loadKeysFromDB();

		if (!publicKey && this.dbPublicKey) {
			publicKey = this.dbPublicKey;
		}

		if (!privateKey && this.dbPrivateKey) {
			try {
				privateKey = await this.decodePrivateKey(this.dbPrivateKey);
			} catch (error) {
				this.started = false;
				this.failedToDecodeKey = true;
				this.openAlert({
					title: TAPi18n.__('Wasn\'t possible to decode your encryption key to be imported.'),
					html: '<div>Your encryption password seems wrong. Click here to try again.</div>',
					modifiers: ['large', 'danger'],
					closable: true,
					icon: 'key',
					action: () => {
						this.startClient();
						this.closeAlert();
					},
				});
				return;
			}
		}

		if (publicKey && privateKey) {
			await this.loadKeys({ publicKey, privateKey });
		} else {
			await this.createAndLoadKeys();
		}

		// TODO: Split in 2 methods to persist keys
		if (!this.dbPublicKey || !this.dbPrivateKey) {
			const publicKey = Meteor._localStorage.getItem('public_key');
			const privateKey = Meteor._localStorage.getItem('private_key');

			if (!publicKey || !privateKey) {
				throw new Error();
			}

			await APIClient.v1.post<E2EEKeyPair, void>('e2e.setUserPublicAndPrivateKeys', {
			// eslint-disable-next-line @typescript-eslint/camelcase
				public_key: publicKey,
				// eslint-disable-next-line @typescript-eslint/camelcase
				private_key: await this.encodePrivateKey(privateKey, this.createRandomPassword()),
			});
		}

		const randomPassword = Meteor._localStorage.getItem('e2e.randomPassword');
		if (randomPassword) {
			const passwordRevealText = TAPi18n.__('E2E_password_reveal_text', {
				postProcess: 'sprintf',
				sprintf: [randomPassword],
			});

			this.openAlert({
				title: TAPi18n.__('Save_Your_Encryption_Password'),
				html: TAPi18n.__('Click_here_to_view_and_copy_your_password'),
				modifiers: ['large'],
				closable: false,
				icon: 'key',
				action: () => {
					imperativeModal.open({ component: SaveE2EEPasswordModal,
						props: {
							passwordRevealText,
							onClose: imperativeModal.close,
							onCancel: (): void => {
								this.closeAlert();
								imperativeModal.close();
							},
							onConfirm: (): void => {
								Meteor._localStorage.removeItem('e2e.randomPassword');
								this.closeAlert();
								imperativeModal.close();
							},
						},
					});
				},
			});
		}
		this.emit('ready');
	}

	async stopClient(): Promise<void> {
		this.closeAlert();

		Meteor._localStorage.removeItem('public_key');
		Meteor._localStorage.removeItem('private_key');
		this.roomClients?.untrackAll();
		this.privateKey = undefined;
		this.setEnabled(false);
		this._ready.set(false);
		this.started = false;
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

	async loadKeysFromDB(): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/camelcase
		const { public_key, private_key } = await APIClient.v1.get<{}, E2EEKeyPair>('e2e.fetchMyKeys');

		// eslint-disable-next-line @typescript-eslint/camelcase
		this.dbPublicKey = public_key;
		// eslint-disable-next-line @typescript-eslint/camelcase
		this.dbPrivateKey = private_key;
	}

	async loadKeys({ publicKey, privateKey }: { publicKey: string; privateKey: string }): Promise<void> {
		Meteor._localStorage.setItem('public_key', publicKey);

		try {
			this.privateKey = await importRSAKey(EJSON.parse(privateKey) as JsonWebKey, ['decrypt']);

			Meteor._localStorage.setItem('private_key', privateKey);
		} catch (error) {
			return console.error('Error importing private key: ', error);
		}
	}

	async createAndLoadKeys(): Promise<void> {
		const key = await generateRSAKey();
		this.privateKey = key.privateKey;

		const publicKey = await exportJWKKey(key.publicKey);

		Meteor._localStorage.setItem('public_key', JSON.stringify(publicKey));

		const privateKey = await exportJWKKey(key.privateKey);

		Meteor._localStorage.setItem('private_key', JSON.stringify(privateKey));

		this.requestSubscriptionKeys();
	}

	async requestSubscriptionKeys(): Promise<void> {
		await APIClient.v1.post('e2e.requestSubscriptionKeys');
	}

	createRandomPassword(): string {
		const randomPassword = `${ Random.id(3) }-${ Random.id(3) }-${ Random.id(3) }`.toLowerCase();
		Meteor._localStorage.setItem('e2e.randomPassword', randomPassword);
		return randomPassword;
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

	async decodePrivateKey(privateKey: string): Promise<string> {
		const password = await this.requestPassword();

		const masterKey = await this.getMasterKey(password);

		const [vector, cipherText] = splitVectorAndEncryptedData(EJSON.parse(privateKey) as Uint8Array);

		const privKey = await decryptAES(vector, masterKey, cipherText);
		return toString(privKey);
	}

	async requestPassword(): Promise<string> {
		return new Promise((resolve) => {
			const showModal = (): void => {
				imperativeModal.open({
					component: EnterE2EEPasswordModal,
					props: {
						onClose: imperativeModal.close,
						onCancel: (): void => {
							this.failedToDecodeKey = false;
							this.closeAlert();
							imperativeModal.close();
						},
						onConfirm: (password): void => {
							resolve(password);
							this.closeAlert();
							imperativeModal.close();
						},
					},
				});
			};

			const showAlert = (): void => {
				this.openAlert({
					title: TAPi18n.__('Enter_your_E2E_password'),
					html: TAPi18n.__('Click_here_to_enter_your_encryption_password'),
					modifiers: ['large'],
					closable: false,
					icon: 'key',
					action() {
						showModal();
					},
				});
			};

			if (this.failedToDecodeKey) {
				showModal();
			} else {
				showAlert();
			}
		});
	}

	openAlert(config: Omit<banners.LegacyBannerPayload, 'id'>): void {
		banners.open({ id: 'e2e', ...config });
	}

	closeAlert(): void {
		banners.closeById('e2e');
	}
}
