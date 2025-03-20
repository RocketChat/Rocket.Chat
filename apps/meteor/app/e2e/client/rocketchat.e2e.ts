import QueryString from 'querystring';
import URL from 'url';

import type { IE2EEMessage, IMessage, IRoom, ISubscription, IUser, IUploadWithUser, MessageAttachment } from '@rocket.chat/core-typings';
import { isE2EEMessage } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import EJSON from 'ejson';
import _ from 'lodash';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { E2EEState } from './E2EEState';
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
import * as banners from '../../../client/lib/banners';
import type { LegacyBannerPayload } from '../../../client/lib/banners';
import { imperativeModal } from '../../../client/lib/imperativeModal';
import { dispatchToastMessage } from '../../../client/lib/toast';
import { mapMessageFromApi } from '../../../client/lib/utils/mapMessageFromApi';
import { waitUntilFind } from '../../../client/lib/utils/waitUntilFind';
import EnterE2EPasswordModal from '../../../client/views/e2e/EnterE2EPasswordModal';
import SaveE2EPasswordModal from '../../../client/views/e2e/SaveE2EPasswordModal';
import { createQuoteAttachment } from '../../../lib/createQuoteAttachment';
import { getMessageUrlRegex } from '../../../lib/getMessageUrlRegex';
import { isTruthy } from '../../../lib/isTruthy';
import { Rooms, Subscriptions, Messages } from '../../models/client';
import { settings } from '../../settings/client';
import { getUserAvatarURL } from '../../utils/client';
import { sdk } from '../../utils/client/lib/SDKClient';
import { t } from '../../utils/lib/i18n';

import './events';

let failedToDecodeKey = false;

type KeyPair = {
	public_key: string | null;
	private_key: string | null;
};

const ROOM_KEY_EXCHANGE_SIZE = 10;
const E2EEStateDependency = new Tracker.Dependency();

class E2E extends Emitter {
	private started: boolean;

	private instancesByRoomId: Record<IRoom['_id'], E2ERoom>;

	private db_public_key: string | null | undefined;

	private db_private_key: string | null | undefined;

	public privateKey: CryptoKey | undefined;

	public publicKey: string | undefined;

	private keyDistributionInterval: ReturnType<typeof setInterval> | null;

	private state: E2EEState;

	private observable: Meteor.LiveQueryHandle | undefined;

	constructor() {
		super();
		this.started = false;
		this.instancesByRoomId = {};
		this.keyDistributionInterval = null;
		this.observable = undefined;

		this.on('E2E_STATE_CHANGED', ({ prevState, nextState }) => {
			this.log(`${prevState} -> ${nextState}`);
		});

		this.on(E2EEState.READY, async () => {
			await this.onE2EEReady();
		});

		this.on(E2EEState.SAVE_PASSWORD, async () => {
			await this.onE2EEReady();
		});

		this.on(E2EEState.DISABLED, () => {
			this.observable?.stop();
		});

		this.on(E2EEState.NOT_STARTED, () => {
			this.observable?.stop();
		});

		this.on(E2EEState.ERROR, () => {
			this.observable?.stop();
		});

		this.setState(E2EEState.NOT_STARTED);
	}

	log(...msg: unknown[]) {
		log('E2E', ...msg);
	}

	error(...msg: unknown[]) {
		logError('E2E', ...msg);
	}

	getState() {
		return this.state;
	}

	isEnabled(): boolean {
		return this.state !== E2EEState.DISABLED;
	}

	isReady(): boolean {
		E2EEStateDependency.depend();

		// Save_Password state is also a ready state for E2EE
		return this.state === E2EEState.READY || this.state === E2EEState.SAVE_PASSWORD;
	}

	async onE2EEReady() {
		this.log('startClient -> Done');
		this.initiateHandshake();
		await this.handleAsyncE2EESuggestedKey();
		this.log('decryptSubscriptions');
		await this.decryptSubscriptions();
		this.log('decryptSubscriptions -> Done');
		await this.initiateKeyDistribution();
		this.log('initiateKeyDistribution -> Done');
		this.observeSubscriptions();
		this.log('observing subscriptions');
	}

	async onSubscriptionChanged(sub: ISubscription) {
		this.log('Subscription changed', sub);
		if (!sub.encrypted && !sub.E2EKey) {
			this.removeInstanceByRoomId(sub.rid);
			return;
		}

		const e2eRoom = await this.getInstanceByRoomId(sub.rid);
		if (!e2eRoom) {
			return;
		}

		if (sub.E2ESuggestedKey) {
			if (await e2eRoom.importGroupKey(sub.E2ESuggestedKey)) {
				await this.acceptSuggestedKey(sub.rid);
				e2eRoom.keyReceived();
			} else {
				console.warn('Invalid E2ESuggestedKey, rejecting', sub.E2ESuggestedKey);
				await this.rejectSuggestedKey(sub.rid);
			}
		}

		sub.encrypted ? e2eRoom.resume() : e2eRoom.pause();

		// Cover private groups and direct messages
		if (!e2eRoom.isSupportedRoomType(sub.t)) {
			e2eRoom.disable();
			return;
		}

		if (sub.E2EKey && e2eRoom.isWaitingKeys()) {
			e2eRoom.keyReceived();
			return;
		}

		if (!e2eRoom.isReady()) {
			return;
		}

		await e2eRoom.decryptSubscription();
	}

	observeSubscriptions() {
		this.observable?.stop();

		this.observable = Subscriptions.find().observe({
			changed: (sub: ISubscription) => {
				setTimeout(() => this.onSubscriptionChanged(sub), 0);
			},
			added: (sub: ISubscription) => {
				setTimeout(async () => {
					this.log('Subscription added', sub);
					if (!sub.encrypted && !sub.E2EKey) {
						return;
					}
					return this.getInstanceByRoomId(sub.rid);
				}, 0);
			},
			removed: (sub: ISubscription) => {
				this.log('Subscription removed', sub);
				this.removeInstanceByRoomId(sub.rid);
			},
		});
	}

	shouldAskForE2EEPassword() {
		const { private_key } = this.getKeysFromLocalStorage();
		return this.db_private_key && !private_key;
	}

	setState(nextState: E2EEState) {
		const prevState = this.state;

		this.state = nextState;

		E2EEStateDependency.changed();

		this.emit('E2E_STATE_CHANGED', { prevState, nextState });

		this.emit(nextState);
	}

	async handleAsyncE2EESuggestedKey() {
		const subs = Subscriptions.find({ E2ESuggestedKey: { $exists: true } }).fetch();
		await Promise.all(
			subs
				.filter((sub) => sub.E2ESuggestedKey && !sub.E2EKey)
				.map(async (sub) => {
					const e2eRoom = await e2e.getInstanceByRoomId(sub.rid);

					if (!e2eRoom) {
						return;
					}

					if (sub.E2ESuggestedKey && (await e2eRoom.importGroupKey(sub.E2ESuggestedKey))) {
						this.log('Imported valid E2E suggested key');
						await e2e.acceptSuggestedKey(sub.rid);
						e2eRoom.keyReceived();
					} else {
						this.error('Invalid E2ESuggestedKey, rejecting', sub.E2ESuggestedKey);
						await e2e.rejectSuggestedKey(sub.rid);
					}

					sub.encrypted ? e2eRoom.resume() : e2eRoom.pause();
				}),
		);
	}

	async getInstanceByRoomId(rid: IRoom['_id']): Promise<E2ERoom | null> {
		const room = await waitUntilFind(() => Rooms.findOne({ _id: rid }));

		if (room.t !== 'd' && room.t !== 'p') {
			return null;
		}

		if (!room.encrypted) {
			return null;
		}

		const userId = Meteor.userId();
		if (!this.instancesByRoomId[rid] && userId) {
			this.instancesByRoomId[rid] = new E2ERoom(userId, room);
		}

		// When the key was already set and is changed via an update, we update the room instance
		if (
			this.instancesByRoomId[rid].keyID !== undefined &&
			room.e2eKeyId !== undefined &&
			this.instancesByRoomId[rid].keyID !== room.e2eKeyId
		) {
			// KeyID was changed, update instance with new keyID and put room in waiting keys status
			this.instancesByRoomId[rid].onRoomKeyReset(room.e2eKeyId);
		}

		return this.instancesByRoomId[rid];
	}

	removeInstanceByRoomId(rid: IRoom['_id']): void {
		delete this.instancesByRoomId[rid];
	}

	private async persistKeys(
		{ public_key, private_key }: KeyPair,
		password: string,
		{ force }: { force: boolean } = { force: false },
	): Promise<void> {
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
			force,
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
			public_key: Accounts.storageLocation.getItem('public_key'),
			private_key: Accounts.storageLocation.getItem('private_key'),
		};
	}

	initiateHandshake() {
		Object.keys(this.instancesByRoomId).map((key) => this.instancesByRoomId[key].handshake());
	}

	openSaveE2EEPasswordModal(randomPassword: string) {
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
					Accounts.storageLocation.removeItem('e2e.randomPassword');
					this.setState(E2EEState.READY);
					dispatchToastMessage({ type: 'success', message: t('End_To_End_Encryption_Enabled') });
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
				this.setState(E2EEState.ENTER_PASSWORD);
				private_key = await this.decodePrivateKey(this.db_private_key as string);
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
			this.setState(E2EEState.READY);
		} else {
			await this.createAndLoadKeys();
			this.setState(E2EEState.READY);
		}

		if (!this.db_public_key || !this.db_private_key) {
			this.setState(E2EEState.LOADING_KEYS);
			await this.persistKeys(this.getKeysFromLocalStorage(), await this.createRandomPassword());
		}

		const randomPassword = Accounts.storageLocation.getItem('e2e.randomPassword');
		if (randomPassword) {
			this.setState(E2EEState.SAVE_PASSWORD);
			this.openAlert({
				title: () => t('Save_your_encryption_password'),
				html: () => t('Click_here_to_view_and_copy_your_password'),
				modifiers: ['large'],
				closable: false,
				icon: 'key',
				action: () => this.openSaveE2EEPasswordModal(randomPassword),
			});
		}
	}

	async stopClient(): Promise<void> {
		this.log('-> Stop Client');
		this.closeAlert();

		Accounts.storageLocation.removeItem('public_key');
		Accounts.storageLocation.removeItem('private_key');
		this.instancesByRoomId = {};
		this.privateKey = undefined;
		this.publicKey = undefined;
		this.started = false;
		this.keyDistributionInterval && clearInterval(this.keyDistributionInterval);
		this.keyDistributionInterval = null;
		this.setState(E2EEState.DISABLED);
	}

	async changePassword(newPassword: string): Promise<void> {
		await this.persistKeys(this.getKeysFromLocalStorage(), newPassword, { force: true });

		if (Accounts.storageLocation.getItem('e2e.randomPassword')) {
			Accounts.storageLocation.setItem('e2e.randomPassword', newPassword);
		}
	}

	async loadKeysFromDB(): Promise<void> {
		try {
			this.setState(E2EEState.LOADING_KEYS);
			const { public_key, private_key } = await sdk.rest.get('/v1/e2e.fetchMyKeys');

			this.db_public_key = public_key;
			this.db_private_key = private_key;
		} catch (error) {
			this.setState(E2EEState.ERROR);
			this.error('Error fetching RSA keys: ', error);
			// Stop any process since we can't communicate with the server
			// to get the keys. This prevents new key generation
			throw error;
		}
	}

	async loadKeys({ public_key, private_key }: { public_key: string; private_key: string }): Promise<void> {
		Accounts.storageLocation.setItem('public_key', public_key);
		this.publicKey = public_key;

		try {
			this.privateKey = await importRSAKey(EJSON.parse(private_key), ['decrypt']);

			Accounts.storageLocation.setItem('private_key', private_key);
		} catch (error) {
			this.setState(E2EEState.ERROR);
			return this.error('Error importing private key: ', error);
		}
	}

	async createAndLoadKeys(): Promise<void> {
		// Could not obtain public-private keypair from server.
		this.setState(E2EEState.LOADING_KEYS);
		let key;
		try {
			key = await generateRSAKey();
			this.privateKey = key.privateKey;
		} catch (error) {
			this.setState(E2EEState.ERROR);
			return this.error('Error generating key: ', error);
		}

		try {
			const publicKey = await exportJWKKey(key.publicKey);

			this.publicKey = JSON.stringify(publicKey);
			Accounts.storageLocation.setItem('public_key', JSON.stringify(publicKey));
		} catch (error) {
			this.setState(E2EEState.ERROR);
			return this.error('Error exporting public key: ', error);
		}

		try {
			const privateKey = await exportJWKKey(key.privateKey);

			Accounts.storageLocation.setItem('private_key', JSON.stringify(privateKey));
		} catch (error) {
			this.setState(E2EEState.ERROR);
			return this.error('Error exporting private key: ', error);
		}

		await this.requestSubscriptionKeys();
	}

	async requestSubscriptionKeys(): Promise<void> {
		await sdk.call('e2e.requestSubscriptionKeys');
	}

	async createRandomPassword(): Promise<string> {
		const randomPassword = await generateMnemonicPhrase(5);
		Accounts.storageLocation.setItem('e2e.randomPassword', randomPassword);
		return randomPassword;
	}

	async encodePrivateKey(privateKey: string, password: string): Promise<string | void> {
		const masterKey = await this.getMasterKey(password);

		const vector = crypto.getRandomValues(new Uint8Array(16));
		try {
			if (!masterKey) {
				throw new Error('Error getting master key');
			}
			const encodedPrivateKey = await encryptAES(vector, masterKey, toArrayBuffer(privateKey));

			return EJSON.stringify(joinVectorAndEcryptedData(vector, encodedPrivateKey));
		} catch (error) {
			this.setState(E2EEState.ERROR);
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
			this.setState(E2EEState.ERROR);
			return this.error('Error creating a key based on user password: ', error);
		}

		// Derive a key from the password
		try {
			return await deriveKey(toArrayBuffer(Meteor.userId()), baseKey);
		} catch (error) {
			this.setState(E2EEState.ERROR);
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
					dispatchToastMessage({ type: 'info', message: t('End_To_End_Encryption_Not_Enabled') });
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
			if (!masterKey) {
				throw new Error('Error getting master key');
			}
			const privKey = await decryptAES(vector, masterKey, cipherText);
			const privateKey = toString(privKey) as string;

			if (this.db_public_key && privateKey) {
				await this.loadKeys({ public_key: this.db_public_key, private_key: privateKey });
				this.setState(E2EEState.READY);
			} else {
				await this.createAndLoadKeys();
				this.setState(E2EEState.READY);
			}
			dispatchToastMessage({ type: 'success', message: t('End_To_End_Encryption_Enabled') });
		} catch (error) {
			this.setState(E2EEState.ENTER_PASSWORD);
			dispatchToastMessage({ type: 'error', message: t('Your_E2EE_password_is_incorrect') });
			dispatchToastMessage({ type: 'info', message: t('End_To_End_Encryption_Not_Enabled') });
			throw new Error('E2E -> Error decrypting private key');
		}
	}

	async decodePrivateKey(privateKey: string): Promise<string> {
		const password = await this.requestPasswordAlert();

		const masterKey = await this.getMasterKey(password);

		const [vector, cipherText] = splitVectorAndEcryptedData(EJSON.parse(privateKey));

		try {
			if (!masterKey) {
				throw new Error('Error getting master key');
			}
			const privKey = await decryptAES(vector, masterKey, cipherText);
			return toString(privKey);
		} catch (error) {
			this.setState(E2EEState.ENTER_PASSWORD);
			dispatchToastMessage({ type: 'error', message: t('Your_E2EE_password_is_incorrect') });
			dispatchToastMessage({ type: 'info', message: t('End_To_End_Encryption_Not_Enabled') });
			throw new Error('E2E -> Error decrypting private key');
		}
	}

	async decryptFileContent(file: IUploadWithUser): Promise<IUploadWithUser> {
		if (!file.rid) {
			return file;
		}

		const e2eRoom = await this.getInstanceByRoomId(file.rid);

		if (!e2eRoom) {
			return file;
		}

		return e2eRoom.decryptContent(file);
	}

	async decryptMessage(message: IMessage | IE2EEMessage): Promise<IMessage> {
		if (!isE2EEMessage(message) || message.e2e === 'done') {
			return message;
		}

		const e2eRoom = await this.getInstanceByRoomId(message.rid);

		if (!e2eRoom) {
			return message;
		}

		const decryptedMessage = (await e2eRoom.decryptMessage(message)) as IE2EEMessage;

		const decryptedMessageWithQuote = await this.parseQuoteAttachment(decryptedMessage);

		return decryptedMessageWithQuote;
	}

	async decryptPinnedMessage(message: IMessage) {
		const pinnedMessage = message?.attachments?.[0]?.text;

		if (!pinnedMessage) {
			return message;
		}

		const e2eRoom = await this.getInstanceByRoomId(message.rid);

		if (!e2eRoom) {
			return message;
		}

		const data = await e2eRoom.decrypt(pinnedMessage);

		if (!data) {
			return message;
		}

		const decryptedPinnedMessage = { ...message } as IMessage & { attachments: MessageAttachment[] };
		decryptedPinnedMessage.attachments[0].text = data.text;

		return decryptedPinnedMessage;
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
		if (!message?.msg) {
			return message;
		}
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

	async getSuggestedE2EEKeys(usersWaitingForE2EKeys: Record<IRoom['_id'], { _id: IUser['_id']; public_key: string }[]>) {
		const roomIds = Object.keys(usersWaitingForE2EKeys);
		return Object.fromEntries(
			(
				await Promise.all(
					roomIds.map(async (room) => {
						const e2eRoom = await this.getInstanceByRoomId(room);

						if (!e2eRoom) {
							return;
						}
						const usersWithKeys = await e2eRoom.encryptGroupKeyForParticipantsWaitingForTheKeys(usersWaitingForE2EKeys[room]);

						if (!usersWithKeys) {
							return;
						}

						return [room, usersWithKeys];
					}),
				)
			).filter(isTruthy),
		);
	}

	async getSample(roomIds: string[], limit = 3): Promise<string[]> {
		if (limit === 0) {
			return [];
		}

		const randomRoomIds = _.sampleSize(roomIds, ROOM_KEY_EXCHANGE_SIZE);

		const sampleIds: string[] = [];
		for await (const roomId of randomRoomIds) {
			const e2eroom = await this.getInstanceByRoomId(roomId);
			if (!e2eroom?.hasSessionKey()) {
				continue;
			}

			sampleIds.push(roomId);
		}

		if (!sampleIds.length) {
			return this.getSample(roomIds, limit - 1);
		}

		return sampleIds;
	}

	async initiateKeyDistribution() {
		if (this.keyDistributionInterval) {
			return;
		}

		const keyDistribution = async () => {
			const roomIds = Rooms.find({
				'usersWaitingForE2EKeys': { $exists: true },
				'usersWaitingForE2EKeys.userId': { $ne: Meteor.userId() },
			}).map((room) => room._id);
			if (!roomIds.length) {
				return;
			}

			// Prevent function from running and doing nothing when theres something to do
			const sampleIds = await this.getSample(roomIds);

			if (!sampleIds.length) {
				return;
			}

			const { usersWaitingForE2EKeys = {} } = await sdk.rest.get('/v1/e2e.fetchUsersWaitingForGroupKey', { roomIds: sampleIds });

			if (!Object.keys(usersWaitingForE2EKeys).length) {
				return;
			}

			const userKeysWithRooms = await this.getSuggestedE2EEKeys(usersWaitingForE2EKeys);

			if (!Object.keys(userKeysWithRooms).length) {
				return;
			}

			try {
				await sdk.rest.post('/v1/e2e.provideUsersSuggestedGroupKeys', { usersSuggestedGroupKeys: userKeysWithRooms });
			} catch (error) {
				return this.error('Error providing group key to users: ', error);
			}
		};

		// Run first call right away, then schedule for 10s in the future
		await keyDistribution();
		this.keyDistributionInterval = setInterval(keyDistribution, 10000);
	}
}

export const e2e = new E2E();
