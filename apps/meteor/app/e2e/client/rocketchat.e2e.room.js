import { Base64 } from '@rocket.chat/base64';
import { Emitter } from '@rocket.chat/emitter';
import EJSON from 'ejson';

import { RoomManager } from '../../../client/lib/RoomManager';
import { roomCoordinator } from '../../../client/lib/rooms/roomCoordinator';
import { RoomSettingsEnum } from '../../../definition/IRoomTypeConfig';
import { ChatRoom, Subscriptions, Messages } from '../../models/client';
import { sdk } from '../../utils/client/lib/SDKClient';
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
} from './helper';
import { log, logError } from './logger';
import { e2e } from './rocketchat.e2e';

const KEY_ID = Symbol('keyID');
const PAUSED = Symbol('PAUSED');

const permitedMutations = {
	[E2ERoomState.NOT_STARTED]: [E2ERoomState.ESTABLISHING, E2ERoomState.DISABLED, E2ERoomState.KEYS_RECEIVED],
	[E2ERoomState.READY]: [E2ERoomState.DISABLED],
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

const filterMutation = (currentState, nextState) => {
	if (currentState === nextState) {
		return nextState === E2ERoomState.ERROR;
	}

	if (!(currentState in permitedMutations)) {
		return nextState;
	}

	if (permitedMutations[currentState].includes(nextState)) {
		return nextState;
	}

	return false;
};

export class E2ERoom extends Emitter {
	state = undefined;

	[PAUSED] = undefined;

	constructor(userId, roomId, t) {
		super();

		this.userId = userId;
		this.roomId = roomId;
		this.typeOfRoom = t;

		this.once(E2ERoomState.READY, () => this.decryptPendingMessages());
		this.once(E2ERoomState.READY, () => this.decryptSubscription());
		this.on('STATE_CHANGED', (prev) => {
			if (this.roomId === RoomManager.opened) {
				this.log(`[PREV: ${prev}]`, 'State CHANGED');
			}
		});
		this.on('STATE_CHANGED', () => this.handshake());

		this.setState(E2ERoomState.NOT_STARTED);
	}

	log(...msg) {
		log(`E2E ROOM { state: ${this.state}, rid: ${this.roomId} }`, ...msg);
	}

	error(...msg) {
		logError(`E2E ROOM { state: ${this.state}, rid: ${this.roomId} }`, ...msg);
	}

	hasSessionKey() {
		return !!this.groupSessionKey;
	}

	getState() {
		return this.state;
	}

	setState(requestedState) {
		const currentState = this.state;
		const nextState = filterMutation(currentState, requestedState);

		if (!nextState) {
			this.error(`invalid state ${currentState} -> ${requestedState}`);
			return;
		}

		this.state = nextState;
		this.log(currentState, '->', nextState);
		this.emit('STATE_CHANGED', currentState, nextState, this);
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

	async shouldConvertSentMessages(message) {
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

		if (subscription.lastMessage?.t !== 'e2e') {
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

	async decryptPendingMessages() {
		return Messages.find({ rid: this.roomId, t: 'e2e', e2e: 'pending' }).forEach(async ({ _id, ...msg }) => {
			Messages.update({ _id }, await this.decryptMessage(msg));
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
			const groupKey = Subscriptions.findOne({ rid: this.roomId }).E2EKey;
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
			const room = ChatRoom.findOne({ _id: this.roomId });
			if (!room.e2eKeyId) {
				// TODO CHECK_PERMISSION
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

	isSupportedRoomType(type) {
		return roomCoordinator.getRoomDirectives(type).allowRoomSettingChange({}, RoomSettingsEnum.E2E);
	}

	async importGroupKey(groupKey) {
		this.log('Importing room key ->', this.roomId);
		// Get existing group key
		// const keyID = groupKey.slice(0, 12);
		groupKey = groupKey.slice(12);
		groupKey = Base64.decode(groupKey);

		// Decrypt obtained encrypted session key
		try {
			const decryptedKey = await decryptRSA(e2e.privateKey, groupKey);
			this.sessionKeyExportedString = toString(decryptedKey);
		} catch (error) {
			this.error('Error decrypting group key: ', error);
			return false;
		}

		this.keyID = Base64.encode(this.sessionKeyExportedString).slice(0, 12);

		// Import session key for use.
		try {
			const key = await importAESKey(JSON.parse(this.sessionKeyExportedString));
			// Key has been obtained. E2E is now in session.
			this.groupSessionKey = key;
		} catch (error) {
			this.error('Error importing group key: ', error);
			return false;
		}

		return true;
	}

	async createGroupKey() {
		this.log('Creating room key');
		// Create group key
		try {
			this.groupSessionKey = await generateAESKey();
		} catch (error) {
			console.error('Error generating group key: ', error);
			throw error;
		}

		try {
			const sessionKeyExported = await exportJWKKey(this.groupSessionKey);
			this.sessionKeyExportedString = JSON.stringify(sessionKeyExported);
			this.keyID = Base64.encode(this.sessionKeyExportedString).slice(0, 12);

			await sdk.call('e2e.setRoomKeyID', this.roomId, this.keyID);
			await this.encryptKeyForOtherParticipants();
		} catch (error) {
			this.error('Error exporting group key: ', error);
			throw error;
		}
	}

	async encryptKeyForOtherParticipants() {
		// Encrypt generated session key for every user in room and publish to subscription model.
		try {
			const users = (await sdk.call('e2e.getUsersOfRoomWithoutKey', this.roomId)).users.filter((user) => user?.e2e?.public_key);

			if (!users.length) {
				return;
			}

			const usersSuggestedGroupKeys = { [this.roomId]: [] };
			for await (const user of users) {
				const encryptedGroupKey = await this.encryptGroupKeyForParticipant(user.e2e.public_key);

				usersSuggestedGroupKeys[this.roomId].push({ _id: user._id, key: encryptedGroupKey });
			}

			await sdk.rest.post('/v1/e2e.provideUsersSuggestedGroupKeys', { usersSuggestedGroupKeys });
		} catch (error) {
			return this.error('Error getting room users: ', error);
		}
	}

	async encryptGroupKeyForParticipant(public_key) {
		let userKey;
		try {
			userKey = await importRSAKey(JSON.parse(public_key), ['encrypt']);
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

	async sha256Hash(arrayBuffer) {
		const hashArray = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', arrayBuffer)));
		return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	}

	async sha256HashText(text) {
		const encoder = new TextEncoder();
		return this.sha256Hash(encoder.encode(text));
	}

	// Encrypts files before upload. I/O is in arraybuffers.
	async encryptFile(file) {
		// if (!this.isSupportedRoomType(this.typeOfRoom)) {
		// 	return;
		// }

		const fileArrayBuffer = await readFileAsArrayBuffer(file);

		const hash = await this.sha256Hash(new Uint8Array(fileArrayBuffer));

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

		const fileName = await this.sha256HashText(file.name);

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
	async decryptFile(file, key, iv) {
		const ivArray = Base64.decode(iv);
		const cryptoKey = await window.crypto.subtle.importKey('jwk', key, { name: 'AES-CTR' }, true, ['encrypt', 'decrypt']);

		return window.crypto.subtle.decrypt({ name: 'AES-CTR', counter: ivArray, length: 64 }, cryptoKey, file);
	}

	// Encrypts messages
	async encryptText(data) {
		const vector = crypto.getRandomValues(new Uint8Array(16));

		try {
			const result = await encryptAES(vector, this.groupSessionKey, data);
			return this.keyID + Base64.encode(joinVectorAndEcryptedData(vector, result));
		} catch (error) {
			this.error('Error encrypting message: ', error);
			throw error;
		}
	}

	// Helper function for encryption of content
	async encryptMessageContent(contentToBeEncrypted) {
		const data = new TextEncoder().encode(EJSON.stringify(contentToBeEncrypted));

		return {
			algorithm: 'rc.v1.aes-sha2',
			ciphertext: await this.encryptText(data),
		};
	}

	// Helper function for encryption of content
	async encryptMessage(message) {
		const { msg, attachments, ...rest } = message;

		const content = await this.encryptMessageContent({ msg, attachments });

		return {
			...rest,
			content,
			t: 'e2e',
			e2e: 'pending',
		};
	}

	// Helper function for encryption of messages
	encrypt(message) {
		if (!this.isSupportedRoomType(this.typeOfRoom)) {
			return;
		}

		const ts = new Date();

		const data = new TextEncoder('UTF-8').encode(
			EJSON.stringify({
				_id: message._id,
				text: message.msg,
				userId: this.userId,
				ts,
			}),
		);

		return this.encryptText(data);
	}

	async decryptContent(data) {
		if (data.content && data.content.algorithm === 'rc.v1.aes-sha2') {
			const content = await this.decrypt(data.content.ciphertext);
			Object.assign(data, content);
		}

		return data;
	}

	// Decrypt messages
	async decryptMessage(message) {
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
			e2e: 'done',
		};
	}

	async decrypt(message) {
		const keyID = message.slice(0, 12);

		if (keyID !== this.keyID) {
			return message;
		}

		message = message.slice(12);

		const [vector, cipherText] = splitVectorAndEcryptedData(Base64.decode(message));

		try {
			const result = await decryptAES(vector, this.groupSessionKey, cipherText);
			return EJSON.parse(new TextDecoder('UTF-8').decode(new Uint8Array(result)));
		} catch (error) {
			return this.error('Error decrypting message: ', error, message);
		}
	}

	provideKeyToUser(keyId) {
		if (this.keyID !== keyId) {
			return;
		}

		this.encryptKeyForOtherParticipants();
		this.setState(E2ERoomState.READY);
	}

	onStateChange(cb) {
		this.on('STATE_CHANGED', cb);
		return () => this.off('STATE_CHANGED', cb);
	}

	async encryptGroupKeyForParticipantsWaitingForTheKeys(users) {
		if (!this.isReady()) {
			return;
		}

		const usersWithKeys = await Promise.all(
			users.map(async (user) => {
				const { _id, public_key } = user;
				const key = await this.encryptGroupKeyForParticipant(public_key);
				return { _id, key };
			}),
		);

		return usersWithKeys;
	}
}
