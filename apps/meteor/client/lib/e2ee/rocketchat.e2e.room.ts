/* eslint-disable @typescript-eslint/naming-convention */
import { Base64 } from '@rocket.chat/base64';
import type { IE2EEMessage, IMessage, IRoom, ISubscription, IUser, AtLeast, EncryptedMessageContent } from '@rocket.chat/core-typings';
import { isEncryptedMessageContent } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import type { Optional } from '@tanstack/react-query';
import EJSON from 'ejson';

import type { E2ERoomState } from './E2ERoomState';
import { decodePrefixedBase64, encodePrefixedBase64 } from './codec';
import {
	toString,
	toArrayBuffer,
	// joinVectorAndEncryptedData,
	splitVectorAndEncryptedData,
	encryptRSA,
	encryptAes,
	decryptRSA,
	// decryptAesGcm,
	generateAesGcmKey,
	exportJWKKey,
	importAesKey,
	importRSAKey,
	readFileAsArrayBuffer,
	encryptAESCTR,
	generateAESCTRKey,
	sha256HashFromArrayBuffer,
	createSha256HashFromText,
	decryptAes,
} from './helper';
import { createLogger } from './logger';
import { e2e } from './rocketchat.e2e';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { t } from '../../../app/utils/lib/i18n';
import { RoomSettingsEnum } from '../../../definition/IRoomTypeConfig';
import { Messages, Rooms, Subscriptions } from '../../stores';
// import { RoomManager } from '../RoomManager';
import { roomCoordinator } from '../rooms/roomCoordinator';

const log = createLogger('E2E:Room');

const KEY_ID = Symbol('keyID');
const PAUSED = Symbol('PAUSED');

type Mutations = { [k in E2ERoomState]?: E2ERoomState[] };

const permitedMutations: Mutations = {
	NOT_STARTED: ['ESTABLISHING', 'DISABLED', 'KEYS_RECEIVED'],
	READY: ['DISABLED', 'CREATING_KEYS', 'WAITING_KEYS'],
	ERROR: ['KEYS_RECEIVED', 'NOT_STARTED'],
	WAITING_KEYS: ['KEYS_RECEIVED', 'ERROR', 'DISABLED'],
	ESTABLISHING: ['READY', 'KEYS_RECEIVED', 'ERROR', 'DISABLED', 'WAITING_KEYS', 'CREATING_KEYS'],
};

const filterMutation = (currentState: E2ERoomState | undefined, nextState: E2ERoomState): E2ERoomState | false => {
	// When state is undefined, allow it to be moved
	if (!currentState) {
		return nextState;
	}

	if (currentState === nextState) {
		return nextState === 'ERROR' ? 'ERROR' : false;
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

	groupSessionKey: CryptoKey | null = null;

	oldKeys: { E2EKey: CryptoKey | null; ts: Date; e2eKeyId: string }[] | undefined;

	sessionKeyExportedString: string | undefined;

	sessionKeyExported: JsonWebKey | undefined;

	constructor(userId: string, room: IRoom) {
		super();

		this.userId = userId;
		this.roomId = room._id;
		this.typeOfRoom = room.t;
		this.roomKeyId = room.e2eKeyId;

		this.once('READY', async () => {
			await this.decryptOldRoomKeys();
			return this.decryptPendingMessages();
		});
		this.once('READY', () => this.decryptSubscription());
		this.on('STATE_CHANGED', () => this.handshake());

		this.setState('NOT_STARTED');
	}

	hasSessionKey() {
		return !!this.groupSessionKey;
	}

	getState() {
		return this.state;
	}

	setState(requestedState: E2ERoomState) {
		const span = log.span('setState');
		const currentState = this.state;
		const nextState = filterMutation(currentState, requestedState);

		if (!nextState) {
			span.error(`${currentState} -> ${requestedState}`);
			return;
		}

		this.state = nextState;
		span.info(`${currentState} -> ${nextState}`);
		this.emit('STATE_CHANGED', currentState);
		this.emit(nextState, this);
	}

	isReady() {
		return this.state === 'READY';
	}

	isDisabled() {
		return this.state === 'DISABLED';
	}

	enable() {
		if (this.state === 'READY') {
			return;
		}

		this.setState('READY');
	}

	disable() {
		this.setState('DISABLED');
	}

	pause() {
		this[PAUSED] = true;
		this.emit('PAUSED', true);
	}

	resume() {
		this[PAUSED] = false;
		this.emit('PAUSED', false);
	}

	keyReceived() {
		this.setState('KEYS_RECEIVED');
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
		return this.state === 'WAITING_KEYS';
	}

	get keyID() {
		return this[KEY_ID];
	}

	set keyID(keyID) {
		this[KEY_ID] = keyID;
	}

	async decryptSubscription() {
		const span = log.span('decryptSubscription');
		const subscription = Subscriptions.state.find((record) => record.rid === this.roomId);

		if (!subscription) {
			span.warn('no subscription found');
			return;
		}

		const { lastMessage } = subscription;

		if (lastMessage === undefined) {
			span.warn('no lastMessage found');
			return;
		}

		if (lastMessage.t !== 'e2e') {
			span.warn('nothing to do');
			return;
		}

		const message = await this.decryptMessage(lastMessage);

		if (message.msg !== subscription.lastMessage?.msg) {
			span.info('decryptSubscriptions updating lastMessage');
			Subscriptions.state.store({
				...subscription,
				lastMessage: message,
			});
		}

		span.info('decryptSubscriptions Done');
	}

	async decryptOldRoomKeys() {
		const span = log.span('decryptOldRoomKeys');
		const sub = Subscriptions.state.find((record) => record.rid === this.roomId);

		if (!sub?.oldRoomKeys || sub?.oldRoomKeys.length === 0) {
			span.info('Nothing to do');
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
				span.set('error', e);
				span.error(
					`Cannot decrypt old room key with id ${key.e2eKeyId}. This is likely because user private key changed or is missing. Skipping`,
				);
				keys.push({ ...key, E2EKey: null });
			}
		}

		this.oldKeys = keys;
	}

	async exportOldRoomKeys(oldKeys: ISubscription['oldRoomKeys']) {
		const span = log.span('exportOldRoomKeys').set('oldKeys', oldKeys);
		if (!oldKeys || oldKeys.length === 0) {
			span.info('Nothing to do');
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
				span.set('error', e);
				span.error(
					`Cannot decrypt old room key with id ${key.e2eKeyId}. This is likely because user private key changed or is missing. Skipping.`,
				);
			}
		}

		span.info(`Done: ${keys.length} keys exported`);
		return keys;
	}

	async decryptPendingMessages() {
		await Messages.state.updateAsync(
			(record) => record.rid === this.roomId && record.t === 'e2e' && record.e2e === 'pending',
			(record) => this.decryptMessage(record as IE2EEMessage),
		);
	}

	// Initiates E2E Encryption
	async handshake() {
		const span = log.span('handshake');
		if (!e2e.isReady()) {
			return;
		}

		if (this.state !== 'KEYS_RECEIVED' && this.state !== 'NOT_STARTED') {
			return;
		}

		this.setState('ESTABLISHING');

		try {
			const groupKey = Subscriptions.state.find((record) => record.rid === this.roomId)?.E2EKey;
			if (groupKey) {
				await this.importGroupKey(groupKey);
				this.setState('READY');
				span.info('Group key imported');
				return;
			}
		} catch (error) {
			this.setState('ERROR');
			span.set('error', error);
			span.error('Error fetching group key');
			return;
		}

		try {
			const room = Rooms.state.get(this.roomId);
			span.set('room', room);
			if (!room?.e2eKeyId) {
				this.setState('CREATING_KEYS');
				await this.createGroupKey();
				this.setState('READY');
				return;
			}

			this.setState('WAITING_KEYS');
			span.info('Requesting room key');
			sdk.publish('notify-room-users', [`${this.roomId}/e2ekeyRequest`, this.roomId, room.e2eKeyId]);
		} catch (error) {
			span.set('error', error);
			span.error('Error during handshake');
			this.setState('ERROR');
		}
	}

	isSupportedRoomType(type: string) {
		return roomCoordinator.getRoomDirectives(type).allowRoomSettingChange({}, RoomSettingsEnum.E2E);
	}

	async decryptSessionKey(key: string) {
		return importAesKey(JSON.parse(await this.exportSessionKey(key)));
	}

	async exportSessionKey(key: string) {
		const span = log.span('exportSessionKey').set('key', key);
		// The length of a base64 encoded block of 256 bytes is always 344 characters
		const [prefix, decodedKey] = decodePrefixedBase64(key);

		span.set('prefix', prefix);

		if (!e2e.privateKey) {
			span.error('Private key not found');
			throw new Error('Private key not found');
		}

		const decryptedKey = await decryptRSA(e2e.privateKey, decodedKey);
		span.info('Key decrypted');
		return toString(decryptedKey);
	}

	async importGroupKey(groupKey: string) {
		const span = log.span('importGroupKey');
		const [kid, decodedKey] = decodePrefixedBase64(groupKey);

		span.set('kid', kid);

		if (this.keyID === kid && this.groupSessionKey) {
			span.info('Key already imported');
			return true;
		}

		// Decrypt obtained encrypted session key
		try {
			if (!e2e.privateKey) {
				throw new Error('Private key not found');
			}
			const decryptedKey = await decryptRSA(e2e.privateKey, decodedKey);
			this.sessionKeyExportedString = toString(decryptedKey);
		} catch (error) {
			span.set('error', error).error('Error decrypting group key');
			return false;
		}

		// When a new e2e room is created, it will be initialized without an e2e key id
		// This will prevent new rooms from storing `undefined` as the keyid
		if (!this.keyID) {
			this.keyID = this.roomKeyId || kid || crypto.randomUUID();
		}

		// Import session key for use.
		try {
			const key = await importAesKey(JSON.parse(this.sessionKeyExportedString!));
			// Key has been obtained. E2E is now in session.
			this.groupSessionKey = key;
		} catch (error) {
			span.set('error', error).error('Error importing group key');
			return false;
		}

		return true;
	}

	async createNewGroupKey() {
		this.groupSessionKey = await generateAesGcmKey();

		const sessionKeyExported = await exportJWKKey(this.groupSessionKey!);
		this.sessionKeyExportedString = JSON.stringify(sessionKeyExported);
		this.keyID = crypto.randomUUID();
	}

	async createGroupKey() {
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
	}

	async resetRoomKey() {
		const span = log.span('resetRoomKey');

		if (!e2e.publicKey) {
			span.error('No public key found');
			return;
		}

		this.setState('CREATING_KEYS');
		try {
			await this.createNewGroupKey();

			const e2eNewKeys = { e2eKeyId: this.keyID, e2eKey: await this.encryptGroupKeyForParticipant(e2e.publicKey) };

			this.setState('READY');
			span.set('kid', this.keyID).info('Room key reset successfully');

			return e2eNewKeys;
		} catch (error) {
			span.error('Error resetting room key', error);
			throw error;
		}
	}

	onRoomKeyReset(keyID: string) {
		const span = log.span('onRoomKeyReset').set('key_id', keyID);

		if (this.keyID === keyID) {
			span.warn('Key ID matches current key, nothing to do');
			return;
		}

		span.set('new_key_id', keyID).info('Room key has been reset');
		this.setState('WAITING_KEYS');
		this.keyID = keyID;
		this.groupSessionKey = null;
		this.sessionKeyExportedString = undefined;
		this.sessionKeyExported = undefined;
		this.oldKeys = undefined;
	}

	async encryptKeyForOtherParticipants() {
		const span = log.span('encryptKeyForOtherParticipants');
		// Encrypt generated session key for every user in room and publish to subscription model.
		try {
			const mySub = Subscriptions.state.find((record) => record.rid === this.roomId);
			const decryptedOldGroupKeys = await this.exportOldRoomKeys(mySub?.oldRoomKeys);
			const users = (await sdk.call('e2e.getUsersOfRoomWithoutKey', this.roomId)).users.filter((user) => user?.e2e?.public_key);

			if (!users.length) {
				span.info('No users to encrypt the key for');
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
					span.warn(`Could not encrypt group key for user ${user._id}`);
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
			return span.set('error', error).error('Error getting room users');
		}
	}

	async encryptOldKeysForParticipant(publicKey: string, oldRoomKeys: { E2EKey: string; e2eKeyId: string; ts: Date }[]) {
		const span = log.span('encryptOldKeysForParticipant');
		if (!oldRoomKeys || oldRoomKeys.length === 0) {
			span.info('Nothing to do');
			return;
		}

		let userKey;

		try {
			userKey = await importRSAKey(JSON.parse(publicKey), ['encrypt']);
		} catch (error) {
			return span.set('error', error).error('Error importing user key');
		}

		try {
			const keys = [];
			for await (const oldRoomKey of oldRoomKeys) {
				if (!oldRoomKey.E2EKey) {
					continue;
				}
				const encryptedKey = await encryptRSA(userKey, toArrayBuffer(oldRoomKey.E2EKey));
				const encryptedKeyToString = encodePrefixedBase64(oldRoomKey.e2eKeyId, new Uint8Array(encryptedKey));

				keys.push({ ...oldRoomKey, E2EKey: encryptedKeyToString });
			}
			return keys;
		} catch (error) {
			return span.set('error', error).error('failed to encrypt old keys for participant');
		}
	}

	async encryptGroupKeyForParticipant(publicKey: string) {
		const span = log.span('encryptGroupKeyForParticipant');
		let userKey;
		try {
			userKey = await importRSAKey(JSON.parse(publicKey), ['encrypt']);
		} catch (error) {
			return span.set('error', error).error('Error importing user key');
		}

		// Encrypt session key for this user with his/her public key
		try {
			const encryptedUserKey = await encryptRSA(userKey, toArrayBuffer(this.sessionKeyExportedString));
			const encryptedUserKeyToString = encodePrefixedBase64(this.keyID, new Uint8Array(encryptedUserKey));
			span.info('Group key encrypted for participant');
			return encryptedUserKeyToString;
		} catch (error) {
			return span.error('Error encrypting user key', error);
		}
	}

	// Encrypts files before upload. I/O is in arraybuffers.
	async encryptFile(file: File) {
		const span = log.span('encryptFile');

		const fileArrayBuffer = await readFileAsArrayBuffer(file);

		const hash = await sha256HashFromArrayBuffer(fileArrayBuffer);

		const vector = crypto.getRandomValues(new Uint8Array(16));
		const key = await generateAESCTRKey();
		let result;
		try {
			result = await encryptAESCTR(vector, key, fileArrayBuffer);
		} catch (error) {
			return span.set('error', error).error('Error encrypting group key');
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

	// Encrypts messages
	async encryptText(data: Uint8Array<ArrayBuffer>) {
		const span = log.span('encryptText');

		try {
			if (!this.groupSessionKey) {
				throw new Error('No group session key found.');
			}
			const isAesCbc = this.groupSessionKey.algorithm.name === 'AES-CBC';
			if (isAesCbc) {
				span.warn('Using deprecated AES-CBC algorithm for encryption. Please upgrade to AES-GCM.');
			}
			// AES-GCM uses a 12 byte vector, while AES-CBC uses a 16 byte vector
			// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#parameters
			// https://www.rfc-editor.org/rfc/rfc5116.html#section-3.1
			// https://tools.ietf.org/html/rfc3602#section-2
			const vector = crypto.getRandomValues(new Uint8Array(isAesCbc ? 16 : 12));
			const result = await encryptAes(vector, this.groupSessionKey, data);
			const ciphertext = {
				kid: this.keyID,
				iv: Base64.encode(vector),
				ciphertext: Base64.encode(new Uint8Array(result)),
			};
			span.set('ciphertext', ciphertext).info('message encrypted');
			return ciphertext;
		} catch (error) {
			span.set('error', error).error('Error encrypting message');
			throw error;
		}
	}

	// Helper function for encryption of content
	async encryptMessageContent(
		contentToBeEncrypted: Pick<IMessage, 'attachments' | 'files' | 'file'> & Optional<Pick<IMessage, 'msg'>, 'msg'>,
	) {
		const data = new TextEncoder().encode(EJSON.stringify(contentToBeEncrypted));

		return {
			algorithm: 'rc.v2.aes-sha2',
			...(await this.encryptText(data)),
		} as const;
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

	async decryptContent<T extends EncryptedMessageContent>(data: T) {
		const content = await this.decrypt(data.content);
		Object.assign(data, content);

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

		message = isEncryptedMessageContent(message) ? await this.decryptContent(message) : message;

		return {
			...message,
			e2e: 'done' as const,
		};
	}

	// Parses the message to extract the keyID and cipherText
	parse(payload: string | Required<IMessage>['content']): {
		kid: string;
		iv: Uint8Array<ArrayBuffer>;
		ciphertext: Uint8Array<ArrayBuffer>;
	} {
		// v2: {"kid":"...", "iv": "...", "ciphertext":"..."}
		if (typeof payload !== 'string' && payload.algorithm === 'rc.v2.aes-sha2') {
			const iv = Base64.decode(payload.iv);
			const ciphertext = Base64.decode(payload.ciphertext);

			return { kid: payload.kid, iv, ciphertext };
		}
		// v1: kid + base64(vector + ciphertext)
		const message = typeof payload === 'string' ? payload : payload.ciphertext;
		const [kid, decoded] = [message.slice(0, 12), Base64.decode(message.slice(12))];
		const { iv, ciphertext } = splitVectorAndEncryptedData(decoded, 16);
		return {
			kid,
			iv,
			ciphertext,
		};
	}

	async decrypt(
		message: string | Required<IMessage>['content'],
	): Promise<
		| { _id: IMessage['_id']; text: string; userId: IUser['_id']; ts: Date; msg?: undefined }
		| { _id?: undefined; text?: undefined; userId?: undefined; ts?: undefined; msg: string }
	> {
		const span = log.span('decrypt').set('rid', this.roomId);
		const payload = this.parse(message);
		span.set('payload', payload);
		const { kid, iv, ciphertext } = payload;

		const key = this.retrieveDecryptionKey(kid);

		if (!key) {
			span.error('No decryption key found.');
			return { msg: t('E2E_indecipherable') };
		}
		span.set('algorithm', key.algorithm.name);
		span.set('extractable', key.extractable);
		span.set('type', key.type);
		span.set('usages', key.usages.toString());
		try {
			const result = await decryptAes(iv, key, ciphertext);
			const ret = EJSON.parse(new TextDecoder('UTF-8').decode(result));
			span.info('decrypted');
			return ret;
		} catch (error) {
			span.set('error', error).error('Error decrypting message');
			return { msg: t('E2E_Key_Error') };
		}
	}

	private retrieveDecryptionKey(kid: string): CryptoKey | null {
		const oldRoomKey = this.oldKeys?.find((key) => key.e2eKeyId === kid);
		return oldRoomKey?.E2EKey ?? this.groupSessionKey;
	}

	provideKeyToUser(keyId: string) {
		if (this.keyID !== keyId) {
			return;
		}

		void this.encryptKeyForOtherParticipants();
		this.setState('READY');
	}

	onStateChange(cb: () => void) {
		this.on('STATE_CHANGED', cb);
		return () => this.off('STATE_CHANGED', cb);
	}

	async encryptGroupKeyForParticipantsWaitingForTheKeys(users: { _id: IUser['_id']; public_key: string }[]) {
		if (!this.isReady()) {
			return;
		}

		const mySub = Subscriptions.state.find((record) => record.rid === this.roomId);
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
