import { Base64 } from '@rocket.chat/base64';
import type { IE2EEMessage, IMessage, IRoom, ISubscription, IUser, IUploadWithUser, AtLeast } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import type { Optional } from '@tanstack/react-query';
import EJSON from 'ejson';

import { E2ERoomState } from './E2ERoomState';
import {
	toString,
	toArrayBuffer,
	joinVectorAndEcryptedData,
	splitVectorAndEcryptedData,
	encryptRSA,
	encryptAES,
	decryptRSA,
	decryptAES,
	generateAESKey,
	exportJWKKey,
	importAESKey,
	importRSAKey,
	readFileAsArrayBuffer,
	encryptAESCTR,
	generateAESCTRKey,
	sha256HashFromArrayBuffer,
	createSha256HashFromText,
} from './helper';
import { log, logError } from './logger';
import { e2e } from './rocketchat.e2e';
import { RoomManager } from '../../../client/lib/RoomManager';
import { roomCoordinator } from '../../../client/lib/rooms/roomCoordinator';
import { RoomSettingsEnum } from '../../../definition/IRoomTypeConfig';
import { Rooms, Subscriptions, Messages } from '../../models/client';
import { sdk } from '../../utils/client/lib/SDKClient';
import { t } from '../../utils/lib/i18n';

const KEY_ID = Symbol('keyID');
const PAUSED = Symbol('PAUSED');

type Mutations = { [k in keyof typeof E2ERoomState]?: (keyof typeof E2ERoomState)[] };

const permitedMutations: Mutations = {
	[E2ERoomState.NOT_STARTED]: [E2ERoomState.ESTABLISHING, E2ERoomState.DISABLED, E2ERoomState.KEYS_RECEIVED],
	[E2ERoomState.READY]: [E2ERoomState.DISABLED, E2ERoomState.CREATING_KEYS, E2ERoomState.WAITING_KEYS],
	[E2ERoomState.ERROR]: [E2ERoomState.KEYS_RECEIVED, E2ERoomState.NOT_STARTED],
	[E2ERoomState.WAITING_KEYS]: [E2ERoomState.KEYS_RECEIVED, E2ERoomState.ERROR, E2ERoomState.DISABLED],
	[E2ERoomState.ESTABLISHING]: [
		E2ERoomState.READY,
		E2ERoomState.KEYS_RECEIVED,
		E2ERoomState.ERROR,
		E2ERoomState.DISABLED,
		E2ERoomState.WAITING_KEYS,
		E2ERoomState.CREATING_KEYS,
	],
};

const filterMutation = (currentState: E2ERoomState | undefined, nextState: E2ERoomState): E2ERoomState | false => {
	// When state is undefined, allow it to be moved
	if (!currentState) {
		return nextState;
	}

	if (currentState === nextState) {
		return nextState === E2ERoomState.ERROR ? E2ERoomState.ERROR : false;
	}

	if (!(currentState in permitedMutations)) {
		return nextState;
	}

	if (permitedMutations?.[currentState]?.includes(nextState)) {
		return nextState;
	}

	return false;
};

export class E2ERoom extends Emitter {
	state: E2ERoomState | undefined = undefined;

	[PAUSED]: boolean | undefined = undefined;

	[KEY_ID]: string;

	userId: string;

	roomId: string;

	typeOfRoom: string;

	roomKeyId: string | undefined;

	groupSessionKey: CryptoKey | undefined;

	oldKeys: { E2EKey: CryptoKey | null; ts: Date; e2eKeyId: string }[] | undefined;

	sessionKeyExportedString: string | undefined;

	sessionKeyExported: JsonWebKey | undefined;

	constructor(userId: string, room: IRoom) {
		super();

		this.userId = userId;
		this.roomId = room._id;
		this.typeOfRoom = room.t;
		this.roomKeyId = room.e2eKeyId;

		this.once(E2ERoomState.READY, async () => {
			await this.decryptOldRoomKeys();
			return this.decryptPendingMessages();
		});
		this.once(E2ERoomState.READY, () => this.decryptSubscription());
		this.on('STATE_CHANGED', (prev) => {
			if (this.roomId === RoomManager.opened) {
				this.log(`[PREV: ${prev}]`, 'State CHANGED');
			}
		});
		this.on('STATE_CHANGED', () => this.handshake());

		this.setState(E2ERoomState.NOT_STARTED);
	}

	log(...msg: unknown[]) {
		log(`E2E ROOM { state: ${this.state}, rid: ${this.roomId} }`, ...msg);
	}

	error(...msg: unknown[]) {
		logError(`E2E ROOM { state: ${this.state}, rid: ${this.roomId} }`, ...msg);
	}

	hasSessionKey() {
		return !!this.groupSessionKey;
	}

	getState() {
		return this.state;
	}

	setState(requestedState: E2ERoomState) {
		const currentState = this.state;
		const nextState = filterMutation(currentState, requestedState);

		if (!nextState) {
			this.error(`invalid state ${currentState} -> ${requestedState}`);
			return;
		}

		this.state = nextState;
		this.log(currentState, '->', nextState);
		this.emit('STATE_CHANGED', currentState);
		this.emit(nextState, this);
	}

	isReady() {
		return this.state === E2ERoomState.READY;
	}

	isDisabled() {
		return this.state === E2ERoomState.DISABLED;
	}

	enable() {
		if (this.state === E2ERoomState.READY) {
			return;
		}

		this.setState(E2ERoomState.READY);
	}

	disable() {
		this.setState(E2ERoomState.DISABLED);
	}

	pause() {
		this.log('PAUSED', this[PAUSED], '->', true);
		this[PAUSED] = true;
		this.emit('PAUSED', true);
	}

	resume() {
		this.log('PAUSED', this[PAUSED], '->', false);
		this[PAUSED] = false;
		this.emit('PAUSED', false);
	}

	keyReceived() {
		this.setState(E2ERoomState.KEYS_RECEIVED);
	}

	async shouldConvertSentMessages(message: { msg: string }) {
		if (!this.isReady() || this[PAUSED]) {
			return false;
		}

		if (this[PAUSED] === undefined) {
			return new Promise((resolve) => {
				this.once('PAUSED', resolve);
			});
		}

		if (message.msg[0] === '/') {
			return false;
		}

		return true;
	}

	shouldConvertReceivedMessages() {
		return this.isReady();
	}

	isWaitingKeys() {
		return this.state === E2ERoomState.WAITING_KEYS;
	}

	get keyID() {
		return this[KEY_ID];
	}

	set keyID(keyID) {
		this[KEY_ID] = keyID;
	}

	async decryptSubscription() {
		const subscription = Subscriptions.findOne({ rid: this.roomId });

		if (subscription?.lastMessage?.t !== 'e2e') {
			this.log('decryptSubscriptions nothing to do');
			return;
		}

		const message = await this.decryptMessage(subscription.lastMessage);

		Subscriptions.update(
			{
				_id: subscription._id,
			},
			{
				$set: {
					lastMessage: message,
				},
			},
		);
		this.log('decryptSubscriptions Done');
	}

	async decryptOldRoomKeys() {
		const sub = Subscriptions.findOne({ rid: this.roomId });

		if (!sub?.oldRoomKeys || sub?.oldRoomKeys.length === 0) {
			this.log('decryptOldRoomKeys nothing to do');
			return;
		}

		const keys = [];
		for await (const key of sub.oldRoomKeys) {
			try {
				const k = await this.decryptSessionKey(key.E2EKey);
				keys.push({
					...key,
					E2EKey: k,
				});
			} catch (e) {
				this.error(
					`Cannot decrypt old room key with id ${key.e2eKeyId}. This is likely because user private key changed or is missing. Skipping`,
				);
				keys.push({ ...key, E2EKey: null });
			}
		}

		this.oldKeys = keys;
		this.log('decryptOldRoomKeys Done');
	}

	async exportOldRoomKeys(oldKeys: ISubscription['oldRoomKeys']) {
		this.log('exportOldRoomKeys starting');
		if (!oldKeys || oldKeys.length === 0) {
			this.log('exportOldRoomKeys nothing to do');
			return;
		}

		const keys = [];
		for await (const key of oldKeys) {
			try {
				if (!key.E2EKey) {
					continue;
				}

				const k = await this.exportSessionKey(key.E2EKey);
				keys.push({
					...key,
					E2EKey: k,
				});
			} catch (e) {
				this.error(
					`Cannot decrypt old room key with id ${key.e2eKeyId}. This is likely because user private key changed or is missing. Skipping`,
				);
			}
		}

		this.log(`exportOldRoomKeys Done: ${keys.length} keys exported`);
		return keys;
	}

	async decryptPendingMessages() {
		return Messages.find({ rid: this.roomId, t: 'e2e', e2e: 'pending' }).forEach(async ({ _id, ...msg }) => {
			Messages.update({ _id }, await this.decryptMessage({ _id, ...msg }));
		});
	}

	// Initiates E2E Encryption
	async handshake() {
		if (!e2e.isReady()) {
			return;
		}

		if (this.state !== E2ERoomState.KEYS_RECEIVED && this.state !== E2ERoomState.NOT_STARTED) {
			return;
		}

		this.setState(E2ERoomState.ESTABLISHING);

		try {
			const groupKey = Subscriptions.findOne({ rid: this.roomId })?.E2EKey;
			if (groupKey) {
				await this.importGroupKey(groupKey);
				this.setState(E2ERoomState.READY);
				return;
			}
		} catch (error) {
			this.setState(E2ERoomState.ERROR);
			this.error('Error fetching group key: ', error);
			return;
		}

		try {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const room = Rooms.findOne({ _id: this.roomId })!;
			if (!room.e2eKeyId) {
				this.setState(E2ERoomState.CREATING_KEYS);
				await this.createGroupKey();
				this.setState(E2ERoomState.READY);
				return;
			}

			this.setState(E2ERoomState.WAITING_KEYS);
			this.log('Requesting room key');
			sdk.publish('notify-room-users', [`${this.roomId}/e2ekeyRequest`, this.roomId, room.e2eKeyId]);
		} catch (error) {
			// this.error = error;
			this.setState(E2ERoomState.ERROR);
		}
	}

	isSupportedRoomType(type: string) {
		return roomCoordinator.getRoomDirectives(type).allowRoomSettingChange({}, RoomSettingsEnum.E2E);
	}

	async decryptSessionKey(key: string) {
		return importAESKey(JSON.parse(await this.exportSessionKey(key)));
	}

	async exportSessionKey(key: string) {
		key = key.slice(12);
		const decodedKey = Base64.decode(key);

		if (!e2e.privateKey) {
			throw new Error('Private key not found');
		}

		const decryptedKey = await decryptRSA(e2e.privateKey, decodedKey);
		return toString(decryptedKey);
	}

	async importGroupKey(groupKey: string) {
		this.log('Importing room key ->', this.roomId);
		// Get existing group key
		// const keyID = groupKey.slice(0, 12);
		groupKey = groupKey.slice(12);
		const decodedGroupKey = Base64.decode(groupKey);

		// Decrypt obtained encrypted session key
		try {
			if (!e2e.privateKey) {
				throw new Error('Private key not found');
			}
			const decryptedKey = await decryptRSA(e2e.privateKey, decodedGroupKey);
			this.sessionKeyExportedString = toString(decryptedKey);
		} catch (error) {
			this.error('Error decrypting group key: ', error);
			return false;
		}

		// When a new e2e room is created, it will be initialized without an e2e key id
		// This will prevent new rooms from storing `undefined` as the keyid
		if (!this.keyID) {
			this.keyID = this.roomKeyId || (await createSha256HashFromText(this.sessionKeyExportedString)).slice(0, 12);
		}

		// Import session key for use.
		try {
			const key = await importAESKey(JSON.parse(this.sessionKeyExportedString!));
			// Key has been obtained. E2E is now in session.
			this.groupSessionKey = key;
		} catch (error) {
			this.error('Error importing group key: ', error);
			return false;
		}

		return true;
	}

	async createNewGroupKey() {
		this.groupSessionKey = await generateAESKey();

		const sessionKeyExported = await exportJWKKey(this.groupSessionKey);
		this.sessionKeyExportedString = JSON.stringify(sessionKeyExported);
		this.keyID = (await createSha256HashFromText(this.sessionKeyExportedString)).slice(0, 12);
	}

	async createGroupKey() {
		this.log('Creating room key');
		try {
			await this.createNewGroupKey();

			await sdk.call('e2e.setRoomKeyID', this.roomId, this.keyID);
			const myKey = await this.encryptGroupKeyForParticipant(e2e.publicKey!);
			if (myKey) {
				await sdk.rest.post('/v1/e2e.updateGroupKey', {
					rid: this.roomId,
					uid: this.userId,
					key: myKey,
				});
				await this.encryptKeyForOtherParticipants();
			}
		} catch (error) {
			this.error('Error exporting group key: ', error);
			throw error;
		}
	}

	async resetRoomKey() {
		this.log('Resetting room key');
		if (!e2e.publicKey) {
			this.error('Cannot reset room key. No public key found.');
			return;
		}

		this.setState(E2ERoomState.CREATING_KEYS);
		try {
			await this.createNewGroupKey();

			const e2eNewKeys = { e2eKeyId: this.keyID, e2eKey: await this.encryptGroupKeyForParticipant(e2e.publicKey) };

			this.setState(E2ERoomState.READY);
			this.log(`Room key reset done for room ${this.roomId}`);

			return e2eNewKeys;
		} catch (error) {
			this.error('Error resetting group key: ', error);
			throw error;
		}
	}

	onRoomKeyReset(keyID: string) {
		this.log(`Room keyID was reset. New keyID: ${keyID} Previous keyID: ${this.keyID}`);
		this.setState(E2ERoomState.WAITING_KEYS);
		this.keyID = keyID;
		this.groupSessionKey = undefined;
		this.sessionKeyExportedString = undefined;
		this.sessionKeyExported = undefined;
		this.oldKeys = undefined;
	}

	async encryptKeyForOtherParticipants() {
		// Encrypt generated session key for every user in room and publish to subscription model.
		try {
			const mySub = Subscriptions.findOne({ rid: this.roomId });
			const decryptedOldGroupKeys = await this.exportOldRoomKeys(mySub?.oldRoomKeys);
			const users = (await sdk.call('e2e.getUsersOfRoomWithoutKey', this.roomId)).users.filter((user) => user?.e2e?.public_key);

			if (!users.length) {
				return;
			}

			const usersSuggestedGroupKeys: Record<
				string,
				{
					_id: IUser['_id'];
					key: string;
					oldKeys: ISubscription['suggestedOldRoomKeys'];
				}[]
			> = { [this.roomId]: [] };
			for await (const user of users) {
				const encryptedGroupKey = await this.encryptGroupKeyForParticipant(user.e2e!.public_key!);
				if (!encryptedGroupKey) {
					return;
				}
				if (decryptedOldGroupKeys) {
					const oldKeys = await this.encryptOldKeysForParticipant(user.e2e!.public_key!, decryptedOldGroupKeys);
					if (oldKeys) {
						usersSuggestedGroupKeys[this.roomId].push({ _id: user._id, key: encryptedGroupKey, oldKeys });
						continue;
					}
				}
				usersSuggestedGroupKeys[this.roomId].push({ _id: user._id, key: encryptedGroupKey, oldKeys: undefined });
			}

			await sdk.rest.post('/v1/e2e.provideUsersSuggestedGroupKeys', { usersSuggestedGroupKeys });
		} catch (error) {
			return this.error('Error getting room users: ', error);
		}
	}

	async encryptOldKeysForParticipant(publicKey: string, oldRoomKeys: { E2EKey: string; e2eKeyId: string; ts: Date }[]) {
		if (!oldRoomKeys || oldRoomKeys.length === 0) {
			return;
		}

		let userKey;

		try {
			userKey = await importRSAKey(JSON.parse(publicKey), ['encrypt']);
		} catch (error) {
			return this.error('Error importing user key: ', error);
		}

		try {
			const keys = [];
			for await (const oldRoomKey of oldRoomKeys) {
				if (!oldRoomKey.E2EKey) {
					continue;
				}
				const encryptedKey = await encryptRSA(userKey, toArrayBuffer(oldRoomKey.E2EKey));
				const encryptedKeyToString = oldRoomKey.e2eKeyId + Base64.encode(new Uint8Array(encryptedKey));

				keys.push({ ...oldRoomKey, E2EKey: encryptedKeyToString });
			}
			return keys;
		} catch (error) {
			return this.error('Error encrypting user key: ', error);
		}
	}

	async encryptGroupKeyForParticipant(publicKey: string) {
		let userKey;
		try {
			userKey = await importRSAKey(JSON.parse(publicKey), ['encrypt']);
		} catch (error) {
			return this.error('Error importing user key: ', error);
		}
		// const vector = crypto.getRandomValues(new Uint8Array(16));

		// Encrypt session key for this user with his/her public key
		try {
			const encryptedUserKey = await encryptRSA(userKey, toArrayBuffer(this.sessionKeyExportedString));
			const encryptedUserKeyToString = this.keyID + Base64.encode(new Uint8Array(encryptedUserKey));
			return encryptedUserKeyToString;
		} catch (error) {
			return this.error('Error encrypting user key: ', error);
		}
	}

	// Encrypts files before upload. I/O is in arraybuffers.
	async encryptFile(file: File) {
		// if (!this.isSupportedRoomType(this.typeOfRoom)) {
		// 	return;
		// }

		const fileArrayBuffer = await readFileAsArrayBuffer(file);

		const hash = await sha256HashFromArrayBuffer(new Uint8Array(fileArrayBuffer));

		const vector = crypto.getRandomValues(new Uint8Array(16));
		const key = await generateAESCTRKey();
		let result;
		try {
			result = await encryptAESCTR(vector, key, fileArrayBuffer);
		} catch (error) {
			console.log(error);
			return this.error('Error encrypting group key: ', error);
		}

		const exportedKey = await window.crypto.subtle.exportKey('jwk', key);

		const fileName = await createSha256HashFromText(file.name);

		const encryptedFile = new File([toArrayBuffer(result)], fileName);

		return {
			file: encryptedFile,
			key: exportedKey,
			iv: Base64.encode(vector),
			type: file.type,
			hash,
		};
	}

	// Decrypt uploaded encrypted files. I/O is in arraybuffers.
	async decryptFile(file: Uint8Array<ArrayBuffer>, key: JsonWebKey, iv: string) {
		const ivArray = Base64.decode(iv);
		const cryptoKey = await window.crypto.subtle.importKey('jwk', key, { name: 'AES-CTR' }, true, ['encrypt', 'decrypt']);

		return window.crypto.subtle.decrypt({ name: 'AES-CTR', counter: ivArray, length: 64 }, cryptoKey, file);
	}

	// Encrypts messages
	async encryptText(data: Uint8Array<ArrayBufferLike>) {
		const vector = crypto.getRandomValues(new Uint8Array(16));

		try {
			if (!this.groupSessionKey) {
				throw new Error('No group session key found.');
			}
			const result = await encryptAES(vector, this.groupSessionKey, data);
			return this.keyID + Base64.encode(joinVectorAndEcryptedData(vector, result));
		} catch (error) {
			this.error('Error encrypting message: ', error);
			throw error;
		}
	}

	// Helper function for encryption of content
	async encryptMessageContent(
		contentToBeEncrypted: Pick<IMessage, 'attachments' | 'files' | 'file'> & Optional<Pick<IMessage, 'msg'>, 'msg'>,
	) {
		const data = new TextEncoder().encode(EJSON.stringify(contentToBeEncrypted));

		return {
			algorithm: 'rc.v1.aes-sha2',
			ciphertext: await this.encryptText(data),
		};
	}

	// Helper function for encryption of content
	async encryptMessage(message: AtLeast<IMessage, '_id' | 'rid' | 'msg'>): Promise<IE2EEMessage> {
		const { msg, attachments, ...rest } = message;

		const content = await this.encryptMessageContent({ msg, attachments });

		// E2EMessages remove the `msg` property. It's stored in `content` instead.
		// Making the property optional can open a small can of worms, but just ignoring it in here should be fine ;)
		return {
			...rest,
			content,
			t: 'e2e' as const,
			e2e: 'pending' as const,
		} as IE2EEMessage;
	}

	// Helper function for encryption of messages
	encrypt(message: IMessage) {
		if (!this.isSupportedRoomType(this.typeOfRoom)) {
			return;
		}

		if (!this.groupSessionKey) {
			throw new Error(t('E2E_Invalid_Key'));
		}

		const ts = new Date();

		const data = new TextEncoder().encode(
			EJSON.stringify({
				_id: message._id,
				text: message.msg,
				userId: this.userId,
				ts,
			}),
		);

		return this.encryptText(data);
	}

	async decryptContent<T extends IUploadWithUser | IE2EEMessage>(data: T) {
		if (data.content && data.content.algorithm === 'rc.v1.aes-sha2') {
			const content = await this.decrypt(data.content.ciphertext);
			Object.assign(data, content);
		}

		return data;
	}

	// Decrypt messages
	async decryptMessage(message: IMessage | IE2EEMessage): Promise<IE2EEMessage | IMessage> {
		if (message.t !== 'e2e' || message.e2e === 'done') {
			return message;
		}

		if (message.msg) {
			const data = await this.decrypt(message.msg);

			if (data?.text) {
				message.msg = data.text;
			}
		}

		message = await this.decryptContent(message);

		return {
			...message,
			e2e: 'done' as const,
		};
	}

	async doDecrypt(vector: Uint8Array<ArrayBufferLike>, key: CryptoKey, cipherText: Uint8Array<ArrayBufferLike>) {
		const result = await decryptAES(vector, key, cipherText);
		return EJSON.parse(new TextDecoder('UTF-8').decode(new Uint8Array(result)));
	}

	async decrypt(message: string) {
		const keyID = message.slice(0, 12);
		message = message.slice(12);

		const [vector, cipherText] = splitVectorAndEcryptedData(Base64.decode(message));

		let oldKey = null;
		if (keyID !== this.keyID) {
			const oldRoomKey = this.oldKeys?.find((key: any) => key.e2eKeyId === keyID);
			// Messages already contain a keyID stored with them
			// That means that if we cannot find a keyID for the key the message has preppended to
			// The message is indecipherable.
			// In these cases, we'll give a last shot using the current session key, which may not work
			// but will be enough to help with some mobile issues.
			if (!oldRoomKey) {
				try {
					if (!this.groupSessionKey) {
						throw new Error('No group session key found.');
					}
					return await this.doDecrypt(vector, this.groupSessionKey, cipherText);
				} catch (error) {
					this.error('Error decrypting message: ', error, message);
					return { msg: t('E2E_indecipherable') };
				}
			}
			oldKey = oldRoomKey.E2EKey;
		}

		try {
			if (oldKey) {
				return await this.doDecrypt(vector, oldKey, cipherText);
			}
			if (!this.groupSessionKey) {
				throw new Error('No group session key found.');
			}
			return await this.doDecrypt(vector, this.groupSessionKey, cipherText);
		} catch (error) {
			this.error('Error decrypting message: ', error, message);
			return { msg: t('E2E_Key_Error') };
		}
	}

	provideKeyToUser(keyId: string) {
		if (this.keyID !== keyId) {
			return;
		}

		void this.encryptKeyForOtherParticipants();
		this.setState(E2ERoomState.READY);
	}

	onStateChange(cb: () => void) {
		this.on('STATE_CHANGED', cb);
		return () => this.off('STATE_CHANGED', cb);
	}

	async encryptGroupKeyForParticipantsWaitingForTheKeys(users: { _id: IUser['_id']; public_key: string }[]) {
		if (!this.isReady()) {
			return;
		}

		const mySub = Subscriptions.findOne({ rid: this.roomId });
		const decryptedOldGroupKeys = await this.exportOldRoomKeys(mySub?.oldRoomKeys);
		const usersWithKeys = await Promise.all(
			users.map(async (user) => {
				const { _id, public_key } = user;
				const key = await this.encryptGroupKeyForParticipant(public_key);
				if (decryptedOldGroupKeys) {
					const oldKeys = await this.encryptOldKeysForParticipant(public_key, decryptedOldGroupKeys);
					return { _id, key, oldKeys };
				}
				return { _id, key };
			}),
		);

		return usersWithKeys;
	}
}
