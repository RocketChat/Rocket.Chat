import QueryString from 'querystring';
import URL from 'url';

import type { IE2EEMessage, IMessage, IRoom, IUser, IUploadWithUser, Serialized, IE2EEPinnedMessage } from '@rocket.chat/core-typings';
import { isE2EEMessage, isEncryptedMessageContent } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { imperativeModal } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import _ from 'lodash';
import { Accounts } from 'meteor/accounts-base';

import type { E2EEState } from './E2EEState';
import * as Rsa from './crypto/rsa';
import { generatePassphrase } from './helper';
import { Keychain } from './keychain';
import { createLogger } from './logger';
import { E2ERoom } from './rocketchat.e2e.room';
import { limitQuoteChain } from '../../../app/ui-message/client/messageBox/limitQuoteChain';
import { getUserAvatarURL } from '../../../app/utils/client';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { t } from '../../../app/utils/lib/i18n';
import { createQuoteAttachment } from '../../../lib/createQuoteAttachment';
import { getMessageUrlRegex } from '../../../lib/getMessageUrlRegex';
import { isTruthy } from '../../../lib/isTruthy';
import { Rooms, Subscriptions } from '../../stores';
import EnterE2EPasswordModal from '../../views/e2e/EnterE2EPasswordModal';
import SaveE2EPasswordModal from '../../views/e2e/SaveE2EPasswordModal';
import * as banners from '../banners';
import type { LegacyBannerPayload } from '../banners';
import { settings } from '../settings';
import { dispatchToastMessage } from '../toast';
import { mapMessageFromApi } from '../utils/mapMessageFromApi';

let failedToDecodeKey = false;

const log = createLogger('E2E');

type KeyPair = {
	public_key: string | null;
	private_key: string | null;
};

const ROOM_KEY_EXCHANGE_SIZE = 10;

class E2E extends Emitter {
	private userId: string | false = false;

	private keychain: Keychain;

	private instancesByRoomId: Record<IRoom['_id'], E2ERoom> = {};

	private db_public_key: string | null | undefined;

	private db_private_key: string | null | undefined;

	public privateKey: Rsa.PrivateKey | undefined;

	public publicKey: string | undefined;

	private keyDistributionInterval: ReturnType<typeof setInterval> | null = null;

	private state: E2EEState;

	constructor() {
		super();

		this.on('READY', async () => {
			await this.onE2EEReady();
		});

		this.on('SAVE_PASSWORD', async () => {
			await this.onE2EEReady();
		});

		this.on('DISABLED', () => {
			this.unsubscribeFromSubscriptions?.();
		});

		this.on('NOT_STARTED', () => {
			this.unsubscribeFromSubscriptions?.();
		});

		this.on('ERROR', () => {
			this.unsubscribeFromSubscriptions?.();
		});

		this.setState('NOT_STARTED');
	}

	getState() {
		return this.state;
	}

	isEnabled(): boolean {
		return this.state !== 'DISABLED';
	}

	isReady(): boolean {
		// Save_Password state is also a ready state for E2EE
		return this.state === 'READY' || this.state === 'SAVE_PASSWORD';
	}

	async onE2EEReady() {
		this.initiateHandshake();
		await this.handleAsyncE2EESuggestedKey();
		await this.decryptSubscriptions();
		await this.initiateKeyDistribution();
		this.observeSubscriptions();
	}

	async onSubscriptionChanged(sub: SubscriptionWithRoom): Promise<void> {
		const span = log.span('onSubscriptionChanged').set('subscription_id', sub._id).set('room_id', sub.rid).set('encrypted', sub.encrypted);
		if (!sub.encrypted && !sub.E2EKey) {
			this.removeInstanceByRoomId(sub.rid);
			return;
		}

		const e2eRoom = await this.getInstanceByRoomId(sub.rid);
		if (!e2eRoom) {
			span.warn('no e2eRoom found');
			return;
		}

		if (sub.E2ESuggestedKey) {
			if (await e2eRoom.importGroupKey(sub.E2ESuggestedKey)) {
				await this.acceptSuggestedKey(sub.rid);
				e2eRoom.keyReceived();
			} else {
				span.warn('rejected');
				await this.rejectSuggestedKey(sub.rid);
			}
		}

		if (sub.encrypted) {
			e2eRoom.resume();
		} else {
			e2eRoom.pause();
		}

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

		if (sub.lastMessage?.e2e !== 'done') {
			await e2eRoom.decryptSubscription();
		}
	}

	private unsubscribeFromSubscriptions: (() => void) | undefined;

	observeSubscriptions() {
		const span = log.span('observeSubscriptions');
		this.unsubscribeFromSubscriptions?.();

		this.unsubscribeFromSubscriptions = Subscriptions.use.subscribe((state) => {
			const subscriptions = Array.from(state.records.values()).filter((sub) => sub.encrypted || sub.E2EKey);

			const subscribed = new Set(subscriptions.map((sub) => sub.rid));
			const instatiated = new Set(Object.keys(this.instancesByRoomId));
			const excess = instatiated.difference(subscribed);

			if (excess.size) {
				span.info('Unsubscribing from excess instances');
				excess.forEach((rid) => this.removeInstanceByRoomId(rid));
			}

			for (const sub of subscriptions) {
				void this.onSubscriptionChanged(sub);
			}
		});
	}

	setState(nextState: E2EEState) {
		const span = log.span('setState').set('prevState', this.state).set('nextState', nextState);
		const prevState = this.state;

		this.state = nextState;

		span.info(`${prevState} -> ${nextState}`);
		this.emit('E2E_STATE_CHANGED', { prevState, nextState });

		this.emit(nextState);
	}

	async handleAsyncE2EESuggestedKey() {
		const span = log.span('handleAsyncE2EESuggestedKey');
		const subs = Subscriptions.state.filter((sub) => typeof sub.E2ESuggestedKey !== 'undefined');
		await Promise.all(
			subs
				.filter((sub) => sub.E2ESuggestedKey && !sub.E2EKey)
				.map(async (sub) => {
					const e2eRoom = await e2e.getInstanceByRoomId(sub.rid);
					span.set('subscription_id', sub._id).set('room_id', sub.rid);

					if (!e2eRoom) {
						return;
					}

					if (sub.E2ESuggestedKey && (await e2eRoom.importGroupKey(sub.E2ESuggestedKey))) {
						span.info('importedE2ESuggestedKey');
						await e2e.acceptSuggestedKey(sub.rid);
						e2eRoom.keyReceived();
					} else {
						span.error('invalidE2ESuggestedKey');
						await e2e.rejectSuggestedKey(sub.rid);
					}

					if (sub.encrypted) {
						e2eRoom.resume();
					} else {
						e2eRoom.pause();
					}
				}),
		);
		span.info('handledAsyncE2ESuggestedKey');
	}

	private waitForRoom(rid: IRoom['_id']): Promise<IRoom> {
		return new Promise((resolve) => {
			const room = Rooms.state.get(rid);

			if (room) resolve(room);

			const unsubscribe = Rooms.use.subscribe((state) => {
				const room = state.get(rid);
				if (room) {
					unsubscribe();
					resolve(room);
				}
			});
		});
	}

	async getInstanceByRoomId(rid: IRoom['_id']): Promise<E2ERoom | null> {
		if (!this.userId) {
			return null;
		}

		const room = await this.waitForRoom(rid);

		if (room.t !== 'd' && room.t !== 'p') {
			return null;
		}

		if (!room.encrypted) {
			return null;
		}

		if (!this.instancesByRoomId[rid] && this.userId) {
			this.instancesByRoomId[rid] = new E2ERoom(this.userId, room);
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

		return this.instancesByRoomId[rid] ?? null;
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

		const encodedPrivateKey = await this.keychain.encryptKey(private_key, password);

		if (!encodedPrivateKey) {
			throw new Error('Failed to encode private key with provided password.');
		}

		await sdk.rest.post('/v1/e2e.setUserPublicAndPrivateKeys', {
			public_key,
			private_key: JSON.stringify(encodedPrivateKey),
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
					this.setState('READY');
					dispatchToastMessage({ type: 'success', message: t('E2E_encryption_enabled') });
					this.closeAlert();
					imperativeModal.close();
				},
			},
		});
	}

	async startClient(userId: string): Promise<void> {
		const span = log.span('startClient');
		if (this.userId === userId) {
			return;
		}

		span.info(this.state);

		this.userId = userId;
		this.keychain = new Keychain(userId);

		let { public_key, private_key } = this.getKeysFromLocalStorage();

		await this.loadKeysFromDB();

		if (!public_key && this.db_public_key) {
			public_key = this.db_public_key;
		}

		if (this.db_private_key && !private_key) {
			try {
				this.setState('ENTER_PASSWORD');
				private_key = await this.decodePrivateKey(this.db_private_key);
			} catch (error) {
				this.userId = false;
				failedToDecodeKey = true;
				this.openAlert({
					title: "Wasn't possible to decode your encryption key to be imported.", // TODO: missing translation
					html: '<div>Your encryption password seems wrong. Click here to try again.</div>', // TODO: missing translation
					modifiers: ['large', 'danger'],
					closable: true,
					icon: 'key',
					action: async () => {
						await this.startClient(userId);
						this.closeAlert();
					},
				});
				return span.error('E2E -> Error decoding private key: ', error);
			}
		}

		if (public_key && private_key) {
			await this.loadKeys({ public_key, private_key });
			this.setState('READY');
		} else {
			await this.createAndLoadKeys();
			this.setState('READY');
		}

		if (!this.db_public_key || !this.db_private_key) {
			this.setState('LOADING_KEYS');
			await this.persistKeys(this.getKeysFromLocalStorage(), await this.createRandomPassword());
		}

		const randomPassword = Accounts.storageLocation.getItem('e2e.randomPassword');
		if (randomPassword) {
			this.setState('SAVE_PASSWORD');
			this.openAlert({
				title: () => t('Save_your_new_E2EE_password'),
				html: () => t('Click_here_to_view_and_save_your_new_E2EE_password'),
				modifiers: ['large'],
				closable: false,
				icon: 'key',
				action: () => this.openSaveE2EEPasswordModal(randomPassword),
			});
		}
	}

	async stopClient(): Promise<void> {
		const span = log.span('stopClient');
		span.info(this.state);
		this.closeAlert();

		Accounts.storageLocation.removeItem('public_key');
		Accounts.storageLocation.removeItem('private_key');
		this.instancesByRoomId = {};
		this.privateKey = undefined;
		this.publicKey = undefined;
		this.userId = false;
		if (this.keyDistributionInterval) {
			clearInterval(this.keyDistributionInterval);
		}
		this.keyDistributionInterval = null;
		this.setState('DISABLED');
	}

	async changePassword(newPassword: string): Promise<void> {
		await this.persistKeys(this.getKeysFromLocalStorage(), newPassword, { force: true });

		if (Accounts.storageLocation.getItem('e2e.randomPassword')) {
			Accounts.storageLocation.setItem('e2e.randomPassword', newPassword);
		}
	}

	async loadKeysFromDB(): Promise<void> {
		const span = log.span('loadKeysFromDB');
		try {
			this.setState('LOADING_KEYS');
			const { public_key, private_key } = await sdk.rest.get('/v1/e2e.fetchMyKeys');

			this.db_public_key = public_key;
			this.db_private_key = private_key;

			span.info('fetched keys from db');
		} catch (error) {
			this.setState('ERROR');
			span.error('Error fetching RSA keys: ', error);
			// Stop any process since we can't communicate with the server
			// to get the keys. This prevents new key generation
			throw error;
		}
	}

	async loadKeys({ public_key, private_key }: { public_key: string; private_key: string }): Promise<void> {
		const span = log.span('loadKeys');
		Accounts.storageLocation.setItem('public_key', public_key);
		this.publicKey = public_key;

		try {
			this.privateKey = await Rsa.importPrivateKey(JSON.parse(private_key));

			Accounts.storageLocation.setItem('private_key', private_key);
		} catch (error) {
			this.setState('ERROR');
			return span.error('Error importing private key: ', error);
		}
	}

	async createAndLoadKeys(): Promise<void> {
		const span = log.span('createAndLoadKeys');
		// Could not obtain public-private keypair from server.
		this.setState('LOADING_KEYS');
		let keyPair;
		try {
			keyPair = await Rsa.generate();
			this.privateKey = keyPair.privateKey;
		} catch (error) {
			this.setState('ERROR');
			return span.set('error', error).error('Error generating key');
		}

		try {
			const publicKey = await Rsa.exportPublicKey(keyPair.publicKey);

			this.publicKey = JSON.stringify(publicKey);
			Accounts.storageLocation.setItem('public_key', JSON.stringify(publicKey));
		} catch (error) {
			this.setState('ERROR');
			return span.set('error', error).error('Error exporting public key');
		}

		try {
			const privateKey = await Rsa.exportPrivateKey(keyPair.privateKey);

			Accounts.storageLocation.setItem('private_key', JSON.stringify(privateKey));
		} catch (error) {
			this.setState('ERROR');
			return span.set('error', error).error('Error exporting private key');
		}

		await this.requestSubscriptionKeys();
	}

	async requestSubscriptionKeys(): Promise<void> {
		await sdk.call('e2e.requestSubscriptionKeys');
	}

	async createRandomPassword(): Promise<string> {
		const randomPassword = await generatePassphrase();
		Accounts.storageLocation.setItem('e2e.randomPassword', randomPassword);
		return randomPassword;
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
					html: () => t('Click_here_to_enter_your_password'),
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

		if (!this.db_private_key) {
			return;
		}

		try {
			const privateKey = await this.keychain.decryptKey(this.db_private_key, password);

			if (this.db_public_key && privateKey) {
				await this.loadKeys({ public_key: this.db_public_key, private_key: privateKey });
				this.setState('READY');
			} else {
				await this.createAndLoadKeys();
				this.setState('READY');
			}
			dispatchToastMessage({ type: 'success', message: t('E2E_encryption_enabled') });
		} catch (error) {
			this.setState('ENTER_PASSWORD');
			dispatchToastMessage({ type: 'error', message: t('Your_E2EE_password_is_incorrect') });
			dispatchToastMessage({ type: 'info', message: t('End_To_End_Encryption_Not_Enabled') });
			throw new Error('E2E -> Error decrypting private key', { cause: error });
		}
	}

	async decodePrivateKey(privateKey: string): Promise<string> {
		// const span = log.span('decodePrivateKey');
		const password = await this.requestPasswordAlert();
		try {
			const privKey = await this.keychain.decryptKey(privateKey, password);
			return privKey;
		} catch (error) {
			this.setState('ENTER_PASSWORD');
			dispatchToastMessage({ type: 'error', message: t('Your_E2EE_password_is_incorrect') });
			dispatchToastMessage({ type: 'info', message: t('End_To_End_Encryption_Not_Enabled') });
			throw new Error('E2E -> Error decrypting private key', { cause: error });
		}
	}

	async decryptFileContent(file: IUploadWithUser): Promise<IUploadWithUser> {
		if (!file.rid || !isEncryptedMessageContent(file)) {
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

	async decryptPinnedMessage(message: IE2EEPinnedMessage) {
		const span = log.span('decryptPinnedMessage');
		const [pinnedMessage] = message.attachments;

		if (!pinnedMessage) {
			span.warn('No pinned message found');
			return message;
		}

		const e2eRoom = await this.getInstanceByRoomId(message.rid);

		if (!e2eRoom) {
			span.warn('No e2eRoom found');
			return message;
		}

		const data = await e2eRoom.decrypt(pinnedMessage.content);

		// TODO(@cardoso): review backward compatibility
		message.attachments[0].text = data.msg;

		span.info('pinned message decrypted');
		return message;
	}

	async decryptSubscription(subscription: SubscriptionWithRoom): Promise<void> {
		const span = log.span('decryptSubscription');
		const e2eRoom = await this.getInstanceByRoomId(subscription.rid);
		span.info(subscription._id);
		await e2eRoom?.decryptSubscription();
	}

	async decryptSubscriptions(): Promise<void> {
		const subscriptions = Subscriptions.state.filter((subscription) => !!subscription.encrypted);

		await Promise.all(
			subscriptions.map(async (subscription) => {
				await this.decryptSubscription(subscription);
			}),
		);
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

		const siteUrl = settings.peek<string>('Site_Url');

		await Promise.all(
			urls.map(async (url) => {
				if (siteUrl && !url.includes(siteUrl)) {
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

				let quotedMessage: Serialized<IMessage>;
				try {
					const getQuotedMessage = await sdk.rest.get('/v1/chat.getMessage', { msgId });
					quotedMessage = getQuotedMessage?.message;
				} catch (error) {
					console.error(`Error getting quoted message: ${error}`);
					return;
				}

				if (!quotedMessage) {
					return;
				}

				const decryptedQuoteMessage = await this.decryptMessage(mapMessageFromApi(quotedMessage));

				message.attachments = message.attachments || [];
				const useRealName = settings.peek('UI_Use_Real_Name');
				const quoteAttachment = createQuoteAttachment(
					decryptedQuoteMessage,
					url,
					useRealName,
					getUserAvatarURL(decryptedQuoteMessage.u.username || '') as string,
				);

				message.attachments.push(limitQuoteChain(quoteAttachment, settings.peek('Message_QuoteChainLimit') ?? 2));
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

	getUserId(): string {
		if (!this.userId) {
			throw new Error('No userId found');
		}
		return this.userId;
	}

	async initiateKeyDistribution() {
		if (this.keyDistributionInterval) {
			return;
		}

		const predicate = (record: IRoom) =>
			Boolean('usersWaitingForE2EKeys' in record && record.usersWaitingForE2EKeys?.every((user) => user.userId !== this.getUserId()));

		const span = log.span('initiateKeyDistribution');
		const keyDistribution = async () => {
			const roomIds = Rooms.state.filter(predicate).map((room) => room._id);

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
				return span.error('provideUsersSuggestedGroupKeys', error);
			}
		};

		// Run first call right away, then schedule for 10s in the future
		await keyDistribution();
		this.keyDistributionInterval = setInterval(keyDistribution, 10000);
	}
}

export const e2e = new E2E();

Accounts.onLogout(() => {
	void e2e.stopClient();
});
