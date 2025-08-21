import QueryString from 'querystring';
import URL from 'url';

import type { IE2EEMessage, IMessage, IRoom, ISubscription, IUser, IUploadWithUser, MessageAttachment } from '@rocket.chat/core-typings';
import { isE2EEMessage } from '@rocket.chat/core-typings';
import type { KeyPair } from '@rocket.chat/e2ee';
import type { Optional } from '@rocket.chat/e2ee/dist/utils';
import E2EE, { LocalStorage } from '@rocket.chat/e2ee-web';
import { Emitter } from '@rocket.chat/emitter';
import { imperativeModal } from '@rocket.chat/ui-client';
import EJSON from 'ejson';
import _ from 'lodash';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import type { E2EEState } from './E2EEState';
// import { toString, splitVectorAndEcryptedData } from './helper';
import { log, logError } from './logger';
import { E2ERoom } from './rocketchat.e2e.room';
import { settings } from '../../../app/settings/client';
import { limitQuoteChain } from '../../../app/ui-message/client/messageBox/limitQuoteChain';
import { getUserAvatarURL } from '../../../app/utils/client';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { t } from '../../../app/utils/lib/i18n';
import { createQuoteAttachment } from '../../../lib/createQuoteAttachment';
import { getMessageUrlRegex } from '../../../lib/getMessageUrlRegex';
import { isTruthy } from '../../../lib/isTruthy';
import { Messages, Rooms, Subscriptions } from '../../stores';
import EnterE2EPasswordModal from '../../views/e2e/EnterE2EPasswordModal';
import SaveE2EPasswordModal from '../../views/e2e/SaveE2EPasswordModal';
import * as banners from '../banners';
import type { LegacyBannerPayload } from '../banners';
import { dispatchToastMessage } from '../toast';
import { mapMessageFromApi } from '../utils/mapMessageFromApi';

let failedToDecodeKey = false;

const ROOM_KEY_EXCHANGE_SIZE = 10;

//

class E2E extends Emitter<{
	READY: void;
	E2E_STATE_CHANGED: { prevState: E2EEState; nextState: E2EEState };
	SAVE_PASSWORD: void;
	DISABLED: void;
	NOT_STARTED: void;
	ERROR: void;
	LOADING_KEYS: void;
	ENTER_PASSWORD: void;
}> {
	private started: boolean;

	private instancesByRoomId: Record<IRoom['_id'], E2ERoom>;

	private db_public_key: string | null | undefined;

	private db_private_key: string | null | undefined;

	public privateKey: CryptoKey | undefined;

	public publicKey: string | undefined;

	private keyDistributionInterval: ReturnType<typeof setInterval> | null;

	private state: E2EEState;

	private e2ee: E2EE;

	constructor() {
		super();
		this.started = false;
		this.instancesByRoomId = {};
		this.keyDistributionInterval = null;
		this.e2ee = new E2EE(new LocalStorage(Accounts.storageLocation), {
			userId: () => Promise.resolve(Meteor.userId()),
			fetchMyKeys: () => sdk.rest.get('/v1/e2e.fetchMyKeys'),
		});

		this.on('E2E_STATE_CHANGED', ({ prevState, nextState }) => {
			this.log(`${prevState} -> ${nextState}`);
		});

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
		return this.state !== 'DISABLED';
	}

	isReady(): boolean {
		// Save_Password state is also a ready state for E2EE
		return this.state === 'READY' || this.state === 'SAVE_PASSWORD';
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

	private unsubscribeFromSubscriptions: (() => void) | undefined;

	observeSubscriptions() {
		this.unsubscribeFromSubscriptions?.();

		this.unsubscribeFromSubscriptions = Subscriptions.use.subscribe((state) => {
			const subscriptions = Array.from(state.records.values()).filter((sub) => sub.encrypted || sub.E2EKey);

			const subscribed = new Set(subscriptions.map((sub) => sub.rid));
			const instatiated = new Set(Object.keys(this.instancesByRoomId));
			const excess = instatiated.difference(subscribed);

			if (excess.size) {
				this.log('Unsubscribing from excess instances', excess);
				excess.forEach((rid) => this.removeInstanceByRoomId(rid));
			}

			for (const sub of subscriptions) {
				void this.onSubscriptionChanged(sub);
			}
		});
	}

	async shouldAskForE2EEPassword() {
		const { private_key } = await this.e2ee.getKeysFromLocalStorage();
		return this.db_private_key && !private_key;
	}

	setState(nextState: E2EEState) {
		const prevState = this.state;

		this.state = nextState;

		this.emit('E2E_STATE_CHANGED', { prevState, nextState });

		this.emit(nextState);
	}

	async handleAsyncE2EESuggestedKey() {
		const subs = Subscriptions.state.filter((sub) => typeof sub.E2ESuggestedKey !== 'undefined');
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
		const room = await this.waitForRoom(rid);

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
		{ public_key, private_key }: Optional<KeyPair>,
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
					void this.e2ee.removeRandomPassword();
					this.setState('READY');
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

		let { public_key, private_key } = await this.e2ee.getKeysFromLocalStorage();

		await this.loadKeysFromDB();

		if (!public_key && this.db_public_key) {
			public_key = this.db_public_key;
		}

		if (await this.shouldAskForE2EEPassword()) {
			try {
				this.setState('ENTER_PASSWORD');
				private_key = await this.decodePrivateKey(this.db_private_key as string);
			} catch {
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
			this.setState('READY');
		} else {
			await this.createAndLoadKeys();
			this.setState('READY');
		}

		if (!this.db_public_key || !this.db_private_key) {
			this.setState('LOADING_KEYS');
			await this.persistKeys(await this.e2ee.getKeysFromLocalStorage(), await this.e2ee.createRandomPassword(5));
		}

		const randomPassword = await this.e2ee.getRandomPassword();
		if (randomPassword) {
			this.setState('SAVE_PASSWORD');
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

		await this.e2ee.removeKeysFromLocalStorage();
		this.instancesByRoomId = {};
		this.privateKey = undefined;
		this.publicKey = undefined;
		this.started = false;
		this.keyDistributionInterval && clearInterval(this.keyDistributionInterval);
		this.keyDistributionInterval = null;
		this.setState('DISABLED');
	}

	async changePassword(newPassword: string): Promise<void> {
		await this.persistKeys(await this.e2ee.getKeysFromLocalStorage(), newPassword, { force: true });

		if (await this.e2ee.getRandomPassword()) {
			await this.e2ee.storeRandomPassword(newPassword);
		}
	}

	async loadKeysFromDB(): Promise<void> {
		this.setState('LOADING_KEYS');
		await this.e2ee.loadKeysFromDB({
			onSuccess: ({ public_key, private_key }) => {
				this.db_public_key = public_key;
				this.db_private_key = private_key;
			},
			onError: (error) => {
				this.setState('ERROR');
				this.error('Error fetching RSA keys from DB: ', error);
				// Stop any process since we can't communicate with the server
				// to get the keys. This prevents new key generation
				throw error;
			},
		});
	}

	async loadKeys(keys: { public_key: string; private_key: string }): Promise<void> {
		this.publicKey = keys.public_key;
		await this.e2ee.loadKeys(keys, {
			onSuccess: (privateKey) => {
				this.privateKey = privateKey;
			},
			onError: (error) => {
				this.setState('ERROR');
				this.error('Error loading keys: ', error);
			},
			parse: (data) => EJSON.parse(data),
		});
	}

	async createAndLoadKeys(): Promise<void> {
		// Could not obtain public-private keypair from server.
		this.setState('LOADING_KEYS');
		await this.e2ee.createAndLoadKeys({
			onPrivateKey: (privateKey) => {
				this.privateKey = privateKey;
			},
			onPublicKey: (publicKey) => {
				this.publicKey = JSON.stringify(publicKey);
			},
			onError: (error) => {
				this.setState('ERROR');
				this.error('Error creating keys: ', error);
			},
		});

		if (this.getState() === 'ERROR') {
			return;
		}

		await this.requestSubscriptionKeys();
	}

	async requestSubscriptionKeys(): Promise<void> {
		await sdk.call('e2e.requestSubscriptionKeys');
	}

	async encodePrivateKey(privateKey: string, password: string): Promise<string | void> {
		const res = await this.e2ee.encodePrivateKey(privateKey, password);
		if (res.isOk) {
			return res.value;
		}
		this.setState('ERROR');
		return this.error('Error encoding private key: ', res.error);
	}

	async getMasterKey(password: string): Promise<void | CryptoKey> {
		const res = await this.e2ee.getMasterKey(password);

		if (res.isOk) {
			return res.value;
		}

		this.setState('ERROR');
		return this.error('Error getting master key: ', res.error);
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

		if (!this.db_private_key) {
			return;
		}

		const res = await this.e2ee.decodePrivateKey(this.db_private_key, password);

		if (!res.isOk) {
			this.setState('ENTER_PASSWORD');
			dispatchToastMessage({ type: 'error', message: t('Your_E2EE_password_is_incorrect') });
			dispatchToastMessage({ type: 'info', message: t('End_To_End_Encryption_Not_Enabled') });
			throw res.error;
		}

		const privateKey = res.value;

		if (this.db_public_key && privateKey) {
			await this.loadKeys({ public_key: this.db_public_key, private_key: privateKey });
		} else {
			await this.createAndLoadKeys();
		}

		this.setState('READY');
	}

	async decodePrivateKey(privateKey: string): Promise<string> {
		const password = await this.requestPasswordAlert();
		const res = await this.e2ee.decodePrivateKey(privateKey, password);
		if (res.isOk) {
			return res.value;
		}
		this.setState('ENTER_PASSWORD');
		dispatchToastMessage({ type: 'error', message: t('Your_E2EE_password_is_incorrect') });
		dispatchToastMessage({ type: 'info', message: t('End_To_End_Encryption_Not_Enabled') });
		throw new Error('E2E -> Error decrypting private key');
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
		await Messages.state.updateAsync(
			(record) => record.t === 'e2e' && record.e2e === 'pending',
			(record) => this.decryptMessage(record),
		);
	}

	async decryptSubscription(subscriptionId: ISubscription['_id']): Promise<void> {
		const e2eRoom = await this.getInstanceByRoomId(subscriptionId);
		this.log('decryptSubscription ->', subscriptionId);
		await e2eRoom?.decryptSubscription();
	}

	async decryptSubscriptions(): Promise<void> {
		Subscriptions.state
			.filter((subscription) => Boolean(subscription.encrypted))
			.forEach((subscription) => this.decryptSubscription(subscription._id));
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

				message.attachments.push(limitQuoteChain(quoteAttachment, settings.get('Message_QuoteChainLimit') ?? 2));
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

		const predicate = (record: IRoom) =>
			Boolean('usersWaitingForE2EKeys' in record && record.usersWaitingForE2EKeys?.every((user) => user.userId !== Meteor.userId()));

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
				return this.error('Error providing group key to users: ', error);
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
