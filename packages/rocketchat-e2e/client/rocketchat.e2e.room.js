import _ from 'underscore';

import { Base64 } from 'meteor/base64';
import { ReactiveVar } from 'meteor/reactive-var';
import { EJSON } from 'meteor/ejson';
import { Random } from 'meteor/random';
import { TimeSync } from 'meteor/mizzao:timesync';
import { Notifications } from 'meteor/rocketchat:notifications';
import { Rooms, Subscriptions } from 'meteor/rocketchat:models';
import { call } from 'meteor/rocketchat:ui-utils';
import { e2e } from './rocketchat.e2e';
import {
	Deferred,
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

export class E2ERoom {
	constructor(userId, roomId, t) {
		this.userId = userId;
		this.roomId = roomId;
		this.typeOfRoom = t;
		this.establishing = new ReactiveVar(false);

		this._ready = new ReactiveVar(false);
		this.readyPromise = new Deferred();
		this.readyPromise.then(() => {
			this._ready.set(true);
			this.establishing.set(false);

			Notifications.onRoom(this.roomId, 'e2ekeyRequest', async(keyId) => {
				this.provideKeyToUser(keyId);
			});
		});
	}

	// Initiates E2E Encryption
	async handshake() {
		if (!e2e.isReady()) {
			return;
		}

		if (this._ready.get()) {
			return;
		}

		if (this.establishing.get()) {
			return await this.readyPromise;
		}

		console.log('E2E -> Initiating handshake');

		this.establishing.set(true);

		// Cover private groups and direct messages
		if (!this.isSupportedRoomType(this.typeOfRoom)) {
			return;
		}

		// Fetch encrypted session key from subscription model
		let groupKey;
		try {
			groupKey = Subscriptions.findOne({ rid: this.roomId }).E2EKey;
		} catch (error) {
			return console.error('E2E -> Error fetching group key: ', error);
		}

		if (groupKey) {
			await this.importGroupKey(groupKey);
			this.readyPromise.resolve();
			return true;
		}

		const room = Rooms.findOne({ _id: this.roomId });

		if (!room.e2eKeyId) {
			await this.createGroupKey();
			this.readyPromise.resolve();
			return true;
		}

		console.log('E2E -> Requesting room key');
		// TODO: request group key

		Notifications.notifyUsersOfRoom(this.roomId, 'e2ekeyRequest', this.roomId, room.e2eKeyId);
	}

	isSupportedRoomType(type) {
		return ['d', 'p'].includes(type);
	}

	async importGroupKey(groupKey) {
		console.log('E2E -> Importing room key');
		// Get existing group key
		// const keyID = groupKey.slice(0, 12);
		groupKey = groupKey.slice(12);
		groupKey = Base64.decode(groupKey);

		// Decrypt obtained encrypted session key
		try {
			const decryptedKey = await decryptRSA(e2e.privateKey, groupKey);
			this.sessionKeyExportedString = toString(decryptedKey);
		} catch (error) {
			return console.error('E2E -> Error decrypting group key: ', error);
		}

		this.keyID = Base64.encode(this.sessionKeyExportedString).slice(0, 12);

		// Import session key for use.
		try {
			const key = await importAESKey(JSON.parse(this.sessionKeyExportedString));
			// Key has been obtained. E2E is now in session.
			this.groupSessionKey = key;
		} catch (error) {
			return console.error('E2E -> Error importing group key: ', error);
		}
	}

	async createGroupKey() {
		console.log('E2E -> Creating room key');
		// Create group key
		let key;
		try {
			key = await generateAESKey();
			this.groupSessionKey = key;
		} catch (error) {
			return console.error('E2E -> Error generating group key: ', error);
		}

		let sessionKeyExported;
		try {
			sessionKeyExported = await exportJWKKey(this.groupSessionKey);
		} catch (error) {
			return console.error('E2E -> Error exporting group key: ', error);
		}

		this.sessionKeyExportedString = JSON.stringify(sessionKeyExported);
		this.keyID = Base64.encode(this.sessionKeyExportedString).slice(0, 12);

		await call('e2e.setRoomKeyID', this.roomId, this.keyID);

		await this.encryptKeyForOtherParticipants();
	}

	async encryptKeyForOtherParticipants() {
		// Encrypt generated session key for every user in room and publish to subscription model.
		let users;
		try {
			users = await call('e2e.getUsersOfRoomWithoutKey', this.roomId);
		} catch (error) {
			return console.error('E2E -> Error getting room users: ', error);
		}

		users.users.forEach((user) => this.encryptForParticipand(user));
	}

	async encryptForParticipand(user) {
		if (user.e2e.public_key) {
			let userKey;
			try {
				userKey = await importRSAKey(JSON.parse(user.e2e.public_key), ['encrypt']);
			} catch (error) {
				return console.error('E2E -> Error importing user key: ', error);
			}
			// const vector = crypto.getRandomValues(new Uint8Array(16));

			// Encrypt session key for this user with his/her public key
			let encryptedUserKey;
			try {
				encryptedUserKey = await encryptRSA(userKey, toArrayBuffer(this.sessionKeyExportedString));
			} catch (error) {
				return console.error('E2E -> Error encrypting user key: ', error);
			}

			// Key has been encrypted. Publish to that user's subscription model for this room.
			await call('e2e.updateGroupKey', this.roomId, user._id, this.keyID + Base64.encode(new Uint8Array(encryptedUserKey)));
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
			return console.error('E2E -> Error encrypting group key: ', error);
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
			console.error('E2E -> Error decrypting file: ', error);

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
			return console.error('E2E -> Error encrypting message: ', error);
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
		const enc = this.encryptText(data);
		return enc;
	}

	// Decrypt messages
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
			return console.error('E2E -> Error decrypting message: ', error, message);
		}
	}

	provideKeyToUser(keyId) {
		if (this.keyID !== keyId) {
			return;
		}

		this.encryptKeyForOtherParticipants();
	}
}
