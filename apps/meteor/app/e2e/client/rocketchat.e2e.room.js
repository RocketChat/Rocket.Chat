import _ from 'underscore';
import { Base64 } from 'meteor/base64';
import { EJSON } from 'meteor/ejson';
import { Random } from 'meteor/random';
import { Session } from 'meteor/session';
import { Emitter } from '@rocket.chat/emitter';

import { e2e } from './rocketchat.e2e';
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
} from './helper';
import { Notifications } from '../../notifications/client';
import { Rooms, Subscriptions, Messages } from '../../models/client';
import { log, logError } from './logger';
import { E2ERoomState } from './E2ERoomState';
import { call } from '../../../client/lib/utils/call';
import { roomCoordinator } from '../../../client/lib/rooms/roomCoordinator';
import { RoomSettingsEnum } from '../../../definition/IRoomTypeConfig';

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
			if (this.roomId === Session.get('openedRoom')) {
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

		const data = await (subscription.lastMessage?.msg && this.decrypt(subscription.lastMessage.msg));
		if (!data?.text) {
			this.log('decryptSubscriptions nothing to do');
			return;
		}

		Subscriptions.direct.update(
			{
				_id: subscription._id,
			},
			{
				$set: {
					'lastMessage.msg': data.text,
					'lastMessage.e2e': 'done',
				},
			},
		);
		this.log('decryptSubscriptions Done');
	}

	async decryptPendingMessages() {
		return Messages.find({ rid: this.roomId, t: 'e2e', e2e: 'pending' }).forEach(async ({ _id, ...msg }) => {
			Messages.direct.update({ _id }, await this.decryptMessage(msg));
		});
	}

	// Initiates E2E Encryption
	async handshake() {
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
			const room = Rooms.findOne({ _id: this.roomId });
			if (!room.e2eKeyId) {
				// TODO CHECK_PERMISSION
				this.setState(E2ERoomState.CREATING_KEYS);
				await this.createGroupKey();
				this.setState(E2ERoomState.READY);
				return;
			}

			this.setState(E2ERoomState.WAITING_KEYS);
			this.log('Requesting room key');
			Notifications.notifyUsersOfRoom(this.roomId, 'e2ekeyRequest', this.roomId, room.e2eKeyId);
		} catch (error) {
			// this.error = error;
			this.setState(E2ERoomState.ERROR);
		}
	}

	isSupportedRoomType(type) {
		return roomCoordinator.getRoomDirectives(type)?.allowRoomSettingChange({}, RoomSettingsEnum.E2E);
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
			return this.error('Error decrypting group key: ', error);
		}

		this.keyID = Base64.encode(this.sessionKeyExportedString).slice(0, 12);

		// Import session key for use.
		try {
			const key = await importAESKey(JSON.parse(this.sessionKeyExportedString));
			// Key has been obtained. E2E is now in session.
			this.groupSessionKey = key;
		} catch (error) {
			return this.error('Error importing group key: ', error);
		}
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

			await call('e2e.setRoomKeyID', this.roomId, this.keyID);
			await this.encryptKeyForOtherParticipants();
		} catch (error) {
			this.error('Error exporting group key: ', error);
			throw error;
		}
	}

	async encryptKeyForOtherParticipants() {
		// Encrypt generated session key for every user in room and publish to subscription model.
		try {
			const { users } = await call('e2e.getUsersOfRoomWithoutKey', this.roomId);
			users.forEach((user) => this.encryptForParticipant(user));
		} catch (error) {
			return this.error('Error getting room users: ', error);
		}
	}

	async encryptForParticipant(user) {
		let userKey;
		try {
			userKey = await importRSAKey(JSON.parse(user.e2e.public_key), ['encrypt']);
		} catch (error) {
			return this.error('Error importing user key: ', error);
		}
		// const vector = crypto.getRandomValues(new Uint8Array(16));

		// Encrypt session key for this user with his/her public key
		try {
			const encryptedUserKey = await encryptRSA(userKey, toArrayBuffer(this.sessionKeyExportedString));
			// Key has been encrypted. Publish to that user's subscription model for this room.
			await call('e2e.updateGroupKey', this.roomId, user._id, this.keyID + Base64.encode(new Uint8Array(encryptedUserKey)));
		} catch (error) {
			return this.error('Error encrypting user key: ', error);
		}
	}

	// Encrypts files before upload. I/O is in arraybuffers.
	async encryptFile(file) {
		if (!this.isSupportedRoomType(this.typeOfRoom)) {
			return;
		}

		const fileArrayBuffer = await readFileAsArrayBuffer(file);

		const vector = crypto.getRandomValues(new Uint8Array(16));
		let result;
		try {
			result = await encryptAES(vector, this.groupSessionKey, fileArrayBuffer);
		} catch (error) {
			return this.error('Error encrypting group key: ', error);
		}

		const output = joinVectorAndEcryptedData(vector, result);

		const encryptedFile = new File([toArrayBuffer(EJSON.stringify(output))], file.name);

		return encryptedFile;
	}

	// Decrypt uploaded encrypted files. I/O is in arraybuffers.
	async decryptFile(message) {
		if (message[0] !== '{') {
			return;
		}

		const [vector, cipherText] = splitVectorAndEcryptedData(EJSON.parse(message));

		try {
			return await decryptAES(vector, this.groupSessionKey, cipherText);
		} catch (error) {
			this.error('Error decrypting file: ', error);

			return false;
		}
	}

	// Encrypts messages
	async encryptText(data) {
		if (!_.isObject(data)) {
			data = new TextEncoder('UTF-8').encode(EJSON.stringify({ text: data, ack: Random.id((Random.fraction() + 1) * 20) }));
		}

		if (!this.isSupportedRoomType(this.typeOfRoom)) {
			return data;
		}

		const vector = crypto.getRandomValues(new Uint8Array(16));
		let result;
		try {
			result = await encryptAES(vector, this.groupSessionKey, data);
		} catch (error) {
			return this.error('Error encrypting message: ', error);
		}

		return this.keyID + Base64.encode(joinVectorAndEcryptedData(vector, result));
	}

	// Helper function for encryption of messages
	encrypt(message) {
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

	// Decrypt messages

	async decryptMessage(message) {
		if (message.t !== 'e2e' || message.e2e === 'done') {
			return message;
		}

		const data = await this.decrypt(message.msg);

		if (!data?.text) {
			return message;
		}

		return {
			...message,
			msg: data.text,
			e2e: 'done',
		};
	}

	async decrypt(message) {
		if (!this.isSupportedRoomType(this.typeOfRoom)) {
			return message;
		}

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
	}
}
