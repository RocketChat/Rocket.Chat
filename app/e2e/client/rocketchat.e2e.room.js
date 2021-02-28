import _ from 'underscore';
import { Base64 } from 'meteor/base64';
import { EJSON } from 'meteor/ejson';
import { Random } from 'meteor/random';
import { Session } from 'meteor/session';
import { TimeSync } from 'meteor/mizzao:timesync';
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
import { Rooms, Subscriptions, Messages } from '../../models';
import { call } from '../../ui-utils';
import { roomTypes, RoomSettingsEnum } from '../../utils';
import { getConfig } from '../../ui-utils/client/config';

export const E2E_ROOM_STATES = {
	NO_PASSWORD_SET: 'NO_PASSWORD_SET',
	NOT_STARTED: 'NOT_STARTED',
	DISABLED: 'DISABLED',
	HANDSHAKE: 'HANDSHAKE',
	ESTABLISHING: 'ESTABLISHING',
	CREATING_KEYS: 'CREATING_KEYS',
	WAITING_KEYS: 'WAITING_KEYS',
	KEYS_RECEIVED: 'KEYS_RECEIVED',
	READY: 'READY',
	ERROR: 'ERROR',
};

const KEY_ID = Symbol('keyID');
const PAUSED = Symbol('PAUSED');

const reduce = (prev, next) => {
	if (prev === next) {
		return next === E2E_ROOM_STATES.ERROR;
	}

	switch (prev) {
		case E2E_ROOM_STATES.NOT_STARTED:
			return [E2E_ROOM_STATES.ESTABLISHING, E2E_ROOM_STATES.DISABLED, E2E_ROOM_STATES.KEYS_RECEIVED].includes(next) && next;
		case E2E_ROOM_STATES.READY:
			return [E2E_ROOM_STATES.PAUSED, E2E_ROOM_STATES.DISABLED].includes(next) && next;
		case E2E_ROOM_STATES.ERROR:
			return [E2E_ROOM_STATES.KEYS_RECEIVED, E2E_ROOM_STATES.NOT_STARTED].includes(next) && next;
		case E2E_ROOM_STATES.WAITING_KEYS:
			return [E2E_ROOM_STATES.KEYS_RECEIVED, E2E_ROOM_STATES.ERROR, E2E_ROOM_STATES.DISABLED].includes(next) && next;
		case E2E_ROOM_STATES.ESTABLISHING:
			return [E2E_ROOM_STATES.READY, E2E_ROOM_STATES.KEYS_RECEIVED, E2E_ROOM_STATES.ERROR, E2E_ROOM_STATES.DISABLED, E2E_ROOM_STATES.WAITING_KEYS].includes(next) && next;
		default:
			return next;
	}
};

const debug = [getConfig('debug'), getConfig('debug-e2e')].includes('true');
export class E2ERoom extends Emitter {
	log(...msg) {
		if (debug) {
			console.log('[E2E ROOM]', `[STATE: ${ this.state }]`, `[RID: ${ this.roomId }]`, ...msg);
		}
	}

	error(...msg) {
		if (debug) {
			console.error('[E2E ROOM]', `[STATE: ${ this.state }]`, `[RID: ${ this.roomId }]`, ...msg);
		}
	}

	setState(state) {
		const prev = this.state;

		const next = reduce(prev, state);
		if (!next) {
			this.error(`invalid state ${ prev } -> ${ state }`);
			return;
		}
		this.state = state;
		this.emit('STATE_CHANGED', prev, next, this);
		this.emit(state, this);
	}

	constructor(userId, roomId, t) {
		super();
		this.state = undefined;
		// this.error = undefined;

		this.userId = userId;
		this.roomId = roomId;

		this.typeOfRoom = t;

		this.once(E2E_ROOM_STATES.READY, () => this.decryptPendingMessages());
		this.once(E2E_ROOM_STATES.READY, () => this.decryptSubscription());
		this.on('STATE_CHANGED', (prev) => {
			if (this.roomId === Session.get('openedRoom')) {
				this.log(`[PREV: ${ prev }]`, 'State CHANGED');
			}
		});
		this.on('STATE_CHANGED', () => this.handshake());
		this.setState(E2E_ROOM_STATES.NOT_STARTED);
	}


	disable() {
		this.setState(E2E_ROOM_STATES.DISABLED);
	}

	keyReceived() {
		this.setState(E2E_ROOM_STATES.KEYS_RECEIVED);
	}

	pause() {
		this[PAUSED] = true;
	}

	unPause() {
		this[PAUSED] = false;
	}

	isPaused() {
		return this[PAUSED];
	}

	enable() {
		![E2E_ROOM_STATES.READY].includes(this.state) && this.setState(E2E_ROOM_STATES.READY);
	}

	shouldConvertSentMessages() {
		return this.isReady() && ! this.isPaused();
	}

	shouldConvertReceivedMessages() {
		return this.isReady();
	}

	isDisabled() {
		return [E2E_ROOM_STATES.DISABLED].includes(this.state);
	}

	wait(state) {
		return new Promise((resolve) => (state === this.state ? resolve(this) : this.once(state, () => resolve(this)))).then((el) => {
			this.log(this.state, el);
			return el;
		});
	}

	isReady() {
		return [E2E_ROOM_STATES.PAUSED, E2E_ROOM_STATES.READY].includes(this.state);
	}

	isWaitingKeys() {
		return this.state === E2E_ROOM_STATES.WAITING_KEYS;
	}

	get keyID() {
		return this[KEY_ID];
	}

	set keyID(keyID) {
		this[KEY_ID] = keyID;
	}

	async decryptSubscription() {
		const subscription = Subscriptions.findOne({
			rid: this.roomId,
		});

		const data = await (subscription.lastMessage?.msg && this.decrypt(subscription.lastMessage.msg));
		if (!data?.text) {
			this.log('decryptSubscriptions nothing to do');
			return;
		}

		Subscriptions.direct.update({
			_id: subscription._id,
		}, {
			$set: {
				'lastMessage.msg': data.text,
				'lastMessage.e2e': 'done',
			},
		});
		this.log('decryptSubscriptions Done');
	}

	async decryptPendingMessages() {
		return Messages.find({ rid: this.roomId, t: 'e2e', e2e: 'pending' }).forEach(async ({ _id, ...msg }) => {
			Messages.direct.update({ _id }, await this.decryptMessage(msg));
		});
	}

	// Initiates E2E Encryption
	async handshake() {
		switch (this.state) {
			case E2E_ROOM_STATES.KEYS_RECEIVED:
			case E2E_ROOM_STATES.NOT_STARTED:
				this.setState(E2E_ROOM_STATES.ESTABLISHING);
				try {
					const groupKey = Subscriptions.findOne({ rid: this.roomId }).E2EKey;
					if (groupKey) {
						await this.importGroupKey(groupKey);
						return this.setState(E2E_ROOM_STATES.READY);
					}
				} catch (error) {
					this.setState(E2E_ROOM_STATES.ERROR);
					// this.error = error;
					return this.error('Error fetching group key: ', error);
				}

				try {
					const room = Rooms.findOne({ _id: this.roomId });
					if (!room.e2eKeyId) { // TODO CHECK_PERMISSION
						this.setState(E2E_ROOM_STATES.CREATING_KEYS);
						await this.createGroupKey();
						return this.setState(E2E_ROOM_STATES.READY);
					}
					this.setState(E2E_ROOM_STATES.WAITING_KEYS);
					this.log('Requesting room key');
					Notifications.notifyUsersOfRoom(this.roomId, 'e2ekeyRequest', this.roomId, room.e2eKeyId);
				} catch (error) {
					// this.error = error;
					this.setState(E2E_ROOM_STATES.ERROR);
				}
		}
	}

	isSupportedRoomType(type) {
		return roomTypes.getConfig(type).allowRoomSettingChange({}, RoomSettingsEnum.E2E);
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
		let ts;
		if (isNaN(TimeSync.serverOffset())) {
			ts = new Date();
		} else {
			ts = new Date(Date.now() + TimeSync.serverOffset());
		}

		const data = new TextEncoder('UTF-8').encode(EJSON.stringify({
			_id: message._id,
			text: message.msg,
			userId: this.userId,
			ts,
		}));

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
