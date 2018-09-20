import _ from 'underscore';

import { ReactiveVar } from 'meteor/reactive-var';
import { EJSON } from 'meteor/ejson';
import { Random } from 'meteor/random';
import { TimeSync } from 'meteor/mizzao:timesync';

import { RocketChat, call } from 'meteor/rocketchat:lib';
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
		});
	}

	// Initiates E2E Encryption
	async handshake(refresh) {
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
			groupKey = RocketChat.models.Subscriptions.findOne({ rid: this.roomId }).E2EKey;
		} catch (error) {
			return console.error('E2E -> Error fetching group key: ', error);
		}

		if (!groupKey || refresh) {
			await this.createGroupKey();
		} else {
			await this.importGroupKey(groupKey);
		}

		this.readyPromise.resolve();

		return true;
	}

	isSupportedRoomType(type) {
		return ['d', 'p'].includes(type);
	}

	async importGroupKey(groupKey) {
		// Get existing group key
		const [vector, cipherText] = splitVectorAndEcryptedData(EJSON.parse(groupKey));

		// Decrypt obtained encrypted session key
		try {
			const decryptedKey = await decryptRSA(e2e.privateKey, cipherText);
			this.exportedSessionKey = toString(decryptedKey);
		} catch (error) {
			return console.error('E2E -> Error decrypting group key: ', error);
		}

		// Import session key for use.
		try {
			const key = await importAESKey(EJSON.parse(this.exportedSessionKey), vector);
			// Key has been obtained. E2E is now in session.
			this.groupSessionKey = key;
		} catch (error) {
			return console.error('E2E -> Error importing group key: ', error);
		}
	}

	async createGroupKey() {
		// Create group key
		let key;
		try {
			key = await generateAESKey();
			this.groupSessionKey = key;
		} catch (error) {
			return console.error('E2E -> Error generating group key: ', error);
		}

		try {
			const exportedSessionKey = await exportJWKKey(key);
			this.exportedSessionKey = JSON.stringify(exportedSessionKey);
		} catch (error) {
			return console.error('E2E -> Error exporting group key: ', error);
		}

		await this.encryptKeyForOtherParticipants();
	}

	async encryptKeyForOtherParticipants() {
		// Encrypt generated session key for every user in room and publish to subscription model.
		let users;
		try {
			users = await call('getUsersOfRoom', this.roomId, true);
		} catch (error) {
			return console.error('E2E -> Error getting room users: ', error);
		}

		users.records.forEach(async(user) => {
			let keychain;
			try {
				keychain = await call('fetchKeychain', user._id);
			} catch (error) {
				return console.error('E2E -> Error fetching user keychain: ', error);
			}

			const key = JSON.parse(keychain);
			if (key.public_key) {
				let userKey;
				try {
					userKey = await importRSAKey(JSON.parse(key.public_key), ['encrypt']);
				} catch (error) {
					return console.error('E2E -> Error importing user key: ', error);
				}
				const vector = crypto.getRandomValues(new Uint8Array(16));

				// Encrypt session key for this user with his/her public key
				let encryptedUserKey;
				try {
					encryptedUserKey = await encryptRSA(userKey, toArrayBuffer(this.exportedSessionKey));
				} catch (error) {
					return console.error('E2E -> Error encrypting user key: ', error);
				}

				const output = joinVectorAndEcryptedData(vector, encryptedUserKey);

				// Key has been encrypted. Publish to that user's subscription model for this room.
				await call('updateGroupE2EKey', this.roomId, user._id, EJSON.stringify(output));
			}
		});
	}

	// Encrypts files before upload. I/O is in arraybuffers.
	async encryptFile(fileArrayBuffer) {
		if (!this.isSupportedRoomType(this.typeOfRoom)) {
			return;
		}

		const vector = crypto.getRandomValues(new Uint8Array(16));
		let result;
		try {
			result = await encryptAES(vector, this.groupSessionKey, fileArrayBuffer);
		} catch (error) {
			return console.error('E2E -> Error encrypting group key: ', error);
		}

		const output = joinVectorAndEcryptedData(vector, result);

		return toArrayBuffer(EJSON.stringify(output));
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

		return EJSON.stringify(joinVectorAndEcryptedData(vector, result));
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
			ack: Random.id((Random.fraction() + 1) * 20),
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

		const [vector, cipherText] = splitVectorAndEcryptedData(EJSON.parse(message));

		try {
			const result = await decryptAES(vector, this.groupSessionKey, cipherText);
			return EJSON.parse(toString(result));
		} catch (error) {
			return console.error('E2E -> Error decrypting message: ', error, message);
		}
	}
}
