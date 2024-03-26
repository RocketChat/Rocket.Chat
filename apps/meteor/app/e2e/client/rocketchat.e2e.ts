import QueryString from 'querystring';
import URL from 'url';

import type { IE2EEMessage, IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { isE2EEMessage } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import EJSON from 'ejson';
import { Meteor } from 'meteor/meteor';
import type { ReactiveVar as ReactiveVarType } from 'meteor/reactive-var';
import { ReactiveVar } from 'meteor/reactive-var';

import * as banners from '../../../client/lib/banners';
import type { LegacyBannerPayload } from '../../../client/lib/banners';
import { imperativeModal } from '../../../client/lib/imperativeModal';
import { mapMessageFromApi } from '../../../client/lib/utils/mapMessageFromApi';
import { waitUntilFind } from '../../../client/lib/utils/waitUntilFind';
import EnterE2EPasswordModal from '../../../client/views/e2e/EnterE2EPasswordModal';
import SaveE2EPasswordModal from '../../../client/views/e2e/SaveE2EPasswordModal';
import { createQuoteAttachment } from '../../../lib/createQuoteAttachment';
import { getMessageUrlRegex } from '../../../lib/getMessageUrlRegex';
import { ChatRoom, Subscriptions, Messages } from '../../models/client';
import { settings } from '../../settings/client';
import { getUserAvatarURL } from '../../utils/client';
import { sdk } from '../../utils/client/lib/SDKClient';
import { t } from '../../utils/lib/i18n';
import {
	toString,
	toArrayBuffer,
	joinVectorAndEcryptedData,
	splitVectorAndEcryptedData,
	encryptAES,
	decryptAES,
	generateRSAKey,
	exportJWKKey,
	importRSAKey,
	importRawKey,
	deriveKey,
	generateMnemonicPhrase,
} from './helper';
import { log, logError } from './logger';
import { E2ERoom } from './rocketchat.e2e.room';
import './events.js';

let failedToDecodeKey = false;

type KeyPair = {
	public_key: string | null;
	private_key: string | null;
};

class E2E extends Emitter {
	private started: boolean;

	public enabled: ReactiveVarType<boolean>;

	private _ready: ReactiveVarType<boolean>;

	private instancesByRoomId: Record<IRoom['_id'], E2ERoom>;

	private db_public_key: string | null;

	private db_private_key: string | null;

	public privateKey: CryptoKey | undefined;

	constructor() {
		super();
		this.started = false;
		this.enabled = new ReactiveVar(false);
		this._ready = new ReactiveVar(false);
		this.instancesByRoomId = {};

		this.on('ready', async () => {
			this._ready.set(true);
			this.log('startClient -> Done');
			this.log('decryptSubscriptions');

			await this.decryptSubscriptions();
			this.log('decryptSubscriptions -> Done');
		});
	}

	log(...msg: unknown[]) {
		log('E2E', ...msg);
	}

	error(...msg: unknown[]) {
		logError('E2E', ...msg);
	}

	isEnabled(): boolean {
		return this.enabled.get();
	}

	isReady(): boolean {
		return this.enabled.get() && this._ready.get();
	}

	shouldAskForE2EEPassword() {
		const { private_key } = this.getKeysFromLocalStorage();
		return this.db_private_key !== null && !private_key;
	}

	async getInstanceByRoomId(rid: IRoom['_id']): Promise<E2ERoom | null> {
		const room = await waitUntilFind(() => ChatRoom.findOne({ _id: rid }));

		if (room.t !== 'd' && room.t !== 'p') {
			return null;
		}

		if (room.encrypted !== true && !room.e2eKeyId) {
			return null;
		}

		if (!this.instancesByRoomId[rid]) {
			this.instancesByRoomId[rid] = new E2ERoom(Meteor.userId(), rid, room.t);
		}

		return this.instancesByRoomId[rid];
	}

	removeInstanceByRoomId(rid: IRoom['_id']): void {
		delete this.instancesByRoomId[rid];
	}

	async persistKeys({ public_key, private_key }: KeyPair, password: string): Promise<void> {
		if (typeof public_key !== 'string' || typeof private_key !== 'string') {
			throw new Error('Failed to persist keys as they are not strings.');
		}

		const encodedPrivateKey = await this.encodePrivateKey(private_key, password);

		if (!encodedPrivateKey) {
			throw new Error('Failed to encode private key with provided password.');
		}

		await sdk.rest.post('/v1/e2e.setUserPublicAndPrivateKeys', {
			public_key,
			private_key: encodedPrivateKey,
		});
	}

	async acceptSuggestedKey(rid: string): Promise<void> {
		await sdk.rest.post('/v1/e2e.acceptSuggestedGroupKey', {
			rid,
		});
	}

	async rejectSuggestedKey(rid: string): Promise<void> {
		await sdk.rest.post('/v1/e2e.rejectSuggestedGroupKey', {
			rid,
		});
	}

	getKeysFromLocalStorage(): KeyPair {
		return {
			public_key: Meteor._localStorage.getItem('public_key'),
			private_key: Meteor._localStorage.getItem('private_key'),
		};
	}

	initiateHandshake() {
		Object.keys(this.instancesByRoomId).map((key) => this.instancesByRoomId[key].handshake());
	}

	openSaveE2EEPasswordModal(randomPassword: string, onSavePassword?: () => void) {
		imperativeModal.open({
			component: SaveE2EPasswordModal,
			props: {
				randomPassword,
				onClose: imperativeModal.close,
				onCancel: () => {
					this.closeAlert();
					imperativeModal.close();
				},
				onConfirm: () => {
					Meteor._localStorage.removeItem('e2e.randomPassword');
					this._ready.set(true);
					onSavePassword?.();
					this.initiateHandshake();
					this.closeAlert();
					imperativeModal.close();
				},
			},
		});
	}

	async startClient(): Promise<void> {
		if (this.started) {
			return;
		}

		this.log('startClient -> STARTED');

		this.started = true;

		let { public_key, private_key } = this.getKeysFromLocalStorage();

		await this.loadKeysFromDB();

		if (!public_key && this.db_public_key) {
			public_key = this.db_public_key;
		}

		if (this.shouldAskForE2EEPassword()) {
			try {
				private_key = await this.decodePrivateKey(this.db_private_key);
			} catch (error) {
				this.started = false;
				failedToDecodeKey = true;
				this.openAlert({
					title: "Wasn't possible to decode your encryption key to be imported.", // TODO: missing translation
					html: '<div>Your encryption password seems wrong. Click here to try again.</div>', // TODO: missing translation
					modifiers: ['large', 'danger'],
					closable: true,
					icon: 'key',
					action: async () => {
						await this.startClient();
						this.closeAlert();
					},
				});
				return;
			}
		}

		if (public_key && private_key) {
			await this.loadKeys({ public_key, private_key });
		} else {
			await this.createAndLoadKeys();
		}

		if (!this.db_public_key || !this.db_private_key) {
			await this.persistKeys(this.getKeysFromLocalStorage(), await this.createRandomPassword());
		}

		const randomPassword = Meteor._localStorage.getItem('e2e.randomPassword');
		if (randomPassword) {
			this.openAlert({
				title: () => t('Save_your_encryption_password'),
				html: () => t('Click_here_to_view_and_copy_your_password'),
				modifiers: ['large'],
				closable: false,
				icon: 'key',
				action: () => this.openSaveE2EEPasswordModal(randomPassword),
			});
		}
		this.emit('ready');
	}

	async stopClient(): Promise<void> {
		this.log('-> Stop Client');
		this.closeAlert();

		Meteor._localStorage.removeItem('public_key');
		Meteor._localStorage.removeItem('private_key');
		this.instancesByRoomId = {};
		this.privateKey = undefined;
		this.enabled.set(false);
		this._ready.set(false);
		this.started = false;
	}

	async changePassword(newPassword: string): Promise<void> {
		await this.persistKeys(this.getKeysFromLocalStorage(), newPassword);

		if (Meteor._localStorage.getItem('e2e.randomPassword')) {
			Meteor._localStorage.setItem('e2e.randomPassword', newPassword);
		}
	}

	async loadKeysFromDB(): Promise<void> {
		try {
			const { public_key, private_key } = await sdk.rest.get('/v1/e2e.fetchMyKeys');

			this.db_public_key = public_key;
			this.db_private_key = private_key;
		} catch (error) {
			return this.error('Error fetching RSA keys: ', error);
		}
	}

	async loadKeys({ public_key, private_key }: { public_key: string; private_key: string }): Promise<void> {
		Meteor._localStorage.setItem('public_key', public_key);

		try {
			this.privateKey = await importRSAKey(EJSON.parse(private_key), ['decrypt']);

			Meteor._localStorage.setItem('private_key', private_key);
		} catch (error) {
			return this.error('Error importing private key: ', error);
		}
	}

	async createAndLoadKeys(): Promise<void> {
		// Could not obtain public-private keypair from server.
		let key;
		try {
			key = await generateRSAKey();
			this.privateKey = key.privateKey;
		} catch (error) {
			return this.error('Error generating key: ', error);
		}

		try {
			const publicKey = await exportJWKKey(key.publicKey);

			Meteor._localStorage.setItem('public_key', JSON.stringify(publicKey));
		} catch (error) {
			return this.error('Error exporting public key: ', error);
		}

		try {
			const privateKey = await exportJWKKey(key.privateKey);

			Meteor._localStorage.setItem('private_key', JSON.stringify(privateKey));
		} catch (error) {
			return this.error('Error exporting private key: ', error);
		}

		await this.requestSubscriptionKeys();
	}

	async requestSubscriptionKeys(): Promise<void> {
		await sdk.call('e2e.requestSubscriptionKeys');
	}

	async createRandomPassword(): Promise<string> {
		const randomPassword = await generateMnemonicPhrase(5);
		Meteor._localStorage.setItem('e2e.randomPassword', randomPassword);
		return randomPassword;
	}

	async encodePrivateKey(privateKey: string, password: string): Promise<string | void> {
		const masterKey = await this.getMasterKey(password);

		const vector = crypto.getRandomValues(new Uint8Array(16));
		try {
			const encodedPrivateKey = await encryptAES(vector, masterKey, toArrayBuffer(privateKey));

			return EJSON.stringify(joinVectorAndEcryptedData(vector, encodedPrivateKey));
		} catch (error) {
			return this.error('Error encrypting encodedPrivateKey: ', error);
		}
	}

	async getMasterKey(password: string): Promise<void | CryptoKey> {
		if (password == null) {
			alert('You should provide a password');
		}

		// First, create a PBKDF2 "key" containing the password
		let baseKey;
		try {
			baseKey = await importRawKey(toArrayBuffer(password));
		} catch (error) {
			return this.error('Error creating a key based on user password: ', error);
		}

		// Derive a key from the password
		try {
			return await deriveKey(toArrayBuffer(Meteor.userId()), baseKey);
		} catch (error) {
			return this.error('Error deriving baseKey: ', error);
		}
	}

	openEnterE2EEPasswordModal(onEnterE2EEPassword?: (password: string) => void) {
		imperativeModal.open({
			component: EnterE2EPasswordModal,
			props: {
				onClose: imperativeModal.close,
				onCancel: () => {
					failedToDecodeKey = false;
					this.closeAlert();
					imperativeModal.close();
				},
				onConfirm: (password) => {
					onEnterE2EEPassword?.(password);
					this.closeAlert();
					imperativeModal.close();
				},
			},
		});
	}

	async requestPasswordAlert(): Promise<string> {
		return new Promise((resolve) => {
			const showModal = () => this.openEnterE2EEPasswordModal((password) => resolve(password));

			const showAlert = () => {
				this.openAlert({
					title: () => t('Enter_your_E2E_password'),
					html: () => t('Click_here_to_enter_your_encryption_password'),
					modifiers: ['large'],
					closable: false,
					icon: 'key',
					action() {
						showModal();
					},
				});
			};

			if (failedToDecodeKey) {
				showModal();
			} else {
				showAlert();
			}
		});
	}

	async requestPasswordModal(): Promise<string> {
		return new Promise((resolve) => this.openEnterE2EEPasswordModal((password) => resolve(password)));
	}

	async decodePrivateKeyFlow() {
		const password = await this.requestPasswordModal();
		const masterKey = await this.getMasterKey(password);

		if (!this.db_private_key) {
			return;
		}

		const [vector, cipherText] = splitVectorAndEcryptedData(EJSON.parse(this.db_private_key));

		try {
			const privKey = await decryptAES(vector, masterKey, cipherText);
			const privateKey = toString(privKey) as string;

			const { public_key } = this.getKeysFromLocalStorage();

			if (public_key && privateKey) {
				await this.loadKeys({ public_key, private_key: privateKey });
			} else {
				await this.createAndLoadKeys();
			}
		} catch (error) {
			throw new Error('E2E -> Error decrypting private key');
		}
	}

	async decodePrivateKey(privateKey: string): Promise<string> {
		const password = await this.requestPasswordAlert();

		const masterKey = await this.getMasterKey(password);

		const [vector, cipherText] = splitVectorAndEcryptedData(EJSON.parse(privateKey));

		try {
			const privKey = await decryptAES(vector, masterKey, cipherText);
			return toString(privKey);
		} catch (error) {
			throw new Error('E2E -> Error decrypting private key');
		}
	}

	async decryptMessage(message: IMessage | IE2EEMessage): Promise<IMessage> {
		if (!isE2EEMessage(message) || message.e2e === 'done') {
			return message;
		}

		const e2eRoom = await this.getInstanceByRoomId(message.rid);

		if (!e2eRoom) {
			return message;
		}

		const data = await e2eRoom.decrypt(message.msg);

		if (!data) {
			return message;
		}

		const decryptedMessage: IE2EEMessage = {
			...message,
			msg: data.text,
			e2e: 'done',
		};

		const decryptedMessageWithQuote = await this.parseQuoteAttachment(decryptedMessage);

		return decryptedMessageWithQuote;
	}

	async decryptPendingMessages(): Promise<void> {
		return Messages.find({ t: 'e2e', e2e: 'pending' }).forEach(async ({ _id, ...msg }: IMessage) => {
			Messages.update({ _id }, await this.decryptMessage(msg as IE2EEMessage));
		});
	}

	async decryptSubscription(subscriptionId: ISubscription['_id']): Promise<void> {
		const e2eRoom = await this.getInstanceByRoomId(subscriptionId);
		this.log('decryptSubscription ->', subscriptionId);
		await e2eRoom?.decryptSubscription();
	}

	async decryptSubscriptions(): Promise<void> {
		Subscriptions.find({
			encrypted: true,
		}).forEach((subscription) => this.decryptSubscription(subscription._id));
	}

	openAlert(config: Omit<LegacyBannerPayload, 'id'>): void {
		banners.open({ id: 'e2e', ...config });
	}

	closeAlert(): void {
		banners.closeById('e2e');
	}

	async parseQuoteAttachment(message: IE2EEMessage): Promise<IE2EEMessage> {
		const urls = message.msg.match(getMessageUrlRegex()) || [];

		await Promise.all(
			urls.map(async (url) => {
				if (!url.includes(settings.get('Site_Url'))) {
					return;
				}

				const urlObj = URL.parse(url);
				// if the URL doesn't have query params (doesn't reference message) skip
				if (!urlObj.query) {
					return;
				}

				const { msg: msgId } = QueryString.parse(urlObj.query);

				if (!msgId || Array.isArray(msgId)) {
					return;
				}

				const getQuotedMessage = await sdk.rest.get('/v1/chat.getMessage', { msgId });
				const quotedMessage = getQuotedMessage?.message;

				if (!quotedMessage) {
					return;
				}

				const decryptedQuoteMessage = await this.decryptMessage(mapMessageFromApi(quotedMessage));

				message.attachments = message.attachments || [];

				const useRealName = settings.get('UI_Use_Real_Name');
				const quoteAttachment = createQuoteAttachment(
					decryptedQuoteMessage,
					url,
					useRealName,
					getUserAvatarURL(decryptedQuoteMessage.u.username || '') as string,
				);

				message.attachments.push(quoteAttachment);
			}),
		);

		return message;
	}
}

export const e2e = new E2E();
