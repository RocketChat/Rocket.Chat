import _ from 'underscore';

import { ReactiveVar } from 'meteor/reactive-var';
import { EJSON } from 'meteor/ejson';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/tap:i18n';
import { TimeSync } from 'meteor/mizzao:timesync';

import { RocketChat, call } from 'meteor/rocketchat:lib';
import { modal } from 'meteor/rocketchat:ui';
import { E2EStorage } from './store';
import { toString, toArrayBuffer } from './helper';

export class E2ERoom {
	constructor(userId, roomId, t) {
		this.userId = userId;
		this.roomId = roomId;
		this.typeOfRoom = t;
		this.established = new ReactiveVar(false);
		this.establishing = new ReactiveVar(false);
	}

	// Initiates E2E Encryption
	async handshake(refresh) {
		console.log('E2E -> Initiating handshake');
		this.establishing.set(true);

		// Cover private groups and direct messages
		if (this.typeOfRoom !== 'p' && this.typeOfRoom !== 'd') {
			return;
		}

		// Fetch encrypted session key from subscription model
		let groupKey;
		try {
			groupKey = RocketChat.models.Subscriptions.findOne({ rid: this.roomId }).E2EKey;
		} catch (error) {
			console.error('E2E -> Error fetching group key: ', error);
			return;
		}

		if (!groupKey || refresh) {
			await this.createGroupKey();
		} else {
			await this.importGroupKey(groupKey);
		}

		this.established.set(true);
		this.establishing.set(false);

		return true;
	}

	async importGroupKey(groupKey) {
		// Get existing group key
		let cipherText = EJSON.parse(groupKey);
		const vector = cipherText.slice(0, 16);
		cipherText = cipherText.slice(16);

		// Decrypt obtained encrypted session key
		try {
			const decryptedKey = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, E2EStorage.get('private_key'), cipherText);
			this.exportedSessionKey = toString(decryptedKey);
		} catch (error) {
			return console.error('E2E -> Error decrypting group key: ', error);
		}

		// Import session key for use.
		try {
			const key = await crypto.subtle.importKey('jwk', EJSON.parse(this.exportedSessionKey), { name: 'AES-CBC', iv: vector }, true, ['encrypt', 'decrypt']);
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
			key = await crypto.subtle.generateKey({ name: 'AES-CBC', length: 128 }, true, ['encrypt', 'decrypt']);
			this.groupSessionKey = key;
		} catch (error) {
			return console.error('E2E -> Error generating group key: ', error);
		}

		try {
			const exportedSessionKey = await crypto.subtle.exportKey('jwk', key);
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
			console.error('E2E -> Error getting room users: ', error);
			return;
		}

		users.records.forEach(async(user) => {
			let keychain;
			try {
				keychain = await call('fetchKeychain', user._id);
			} catch (error) {
				console.error('E2E -> Error fetching user keychain: ', error);
				return;
			}

			const key = JSON.parse(keychain);
			if (key.public_key) {
				let userKey;
				try {
					userKey = await crypto.subtle.importKey('jwk', JSON.parse(key.public_key), { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: { name: 'SHA-256' } }, true, ['encrypt']);
				} catch (error) {
					console.error('E2E -> Error importing user key: ', error);
					return;
				}
				const vector = crypto.getRandomValues(new Uint8Array(16));

				// Encrypt session key for this user with his/her public key
				let encryptedUserKey;
				try {
					encryptedUserKey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, userKey, toArrayBuffer(this.exportedSessionKey));
				} catch (error) {
					console.error('E2E -> Error encrypting user key: ', error);
					return;
				}
				const cipherText = new Uint8Array(encryptedUserKey);
				const output = new Uint8Array(vector.length + cipherText.length);
				output.set(vector, 0);
				output.set(cipherText, vector.length);

				// Key has been encrypted. Publish to that user's subscription model for this room.
				await call('updateGroupE2EKey', this.roomId, user._id, EJSON.stringify(output));
			}
		});
	}

	// Clears the session key in use by room
	async clearGroupKey() {
		// For every user in room...
		let users;
		try {
			users = await call('getUsersOfRoom', this.roomId, true);
		} catch (error) {
			console.error('E2E -> Error getting room users: ', error);
			return;
		}
		users.records.forEach(async(user) => {
			// ...remove session key for this room
			try {
				await call('updateGroupE2EKey', this.roomId, user._id, null);
			} catch (error) {
				console.error('E2E -> Error clearing room key: ', error);
				return;
			}
			RocketChat.Notifications.notifyUser(user._id, 'e2e', 'clearGroupKey', { roomId: this.roomId, userId: this.userId });
		});
	}

	// Reset E2E session.
	reset(refresh) {
		this.establishing.set(false);
		this.established.set(false);
		this.cipher = null;
		this.groupSessionKey = null;
		this.clearGroupKey(refresh); // Might enter a race condition with the handshake function.
	}

	// Encrypts files before upload. I/O is in arraybuffers.
	async encryptFile(fileArrayBuffer) {
		if (this.typeOfRoom === 'p' || this.typeOfRoom === 'd') {
			const vector = crypto.getRandomValues(new Uint8Array(16));
			let result;
			try {
				result = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: vector }, this.groupSessionKey, fileArrayBuffer);
			} catch (error) {
				console.error('E2E -> Error encrypting group key: ', error);
				return;
			}

			const cipherText = new Uint8Array(result);
			const output = new Uint8Array(vector.length + cipherText.length);
			output.set(vector, 0);
			output.set(cipherText, vector.length);
			return toArrayBuffer(EJSON.stringify(output));
		}
	}

	// Decrypt uploaded encrypted files. I/O is in arraybuffers.
	async decryptFile(message) {
		if (message[0] !== '{') {
			return;
		}

		let cipherText = EJSON.parse(message);
		const vector = cipherText.slice(0, 16);
		cipherText = cipherText.slice(16);
		try {
			return await crypto.subtle.decrypt({ name: 'AES-CBC', iv: vector }, this.groupSessionKey, cipherText);
		} catch (error) {
			console.error('E2E -> Error decrypting file: ', error);
			// Session key was reset. Cannot decrypt this file anymore.
			modal.open({
				title: `<i class='icon-key alert-icon failure-color'></i>${ TAPi18n.__('E2E') }`,
				text: TAPi18n.__('Some messages cannot be decrypted because session key was reset.'),
				html: true,
			});

			return false;
		}
	}

	// Encrypts messages
	async encryptText(data) {
		if (!_.isObject(data)) {
			data = new TextEncoder('UTF-8').encode(EJSON.stringify({ text: data, ack: Random.id((Random.fraction() + 1) * 20) }));
		}
		if (this.typeOfRoom === 'p' || this.typeOfRoom === 'd') {
			const vector = crypto.getRandomValues(new Uint8Array(16));
			let result;
			try {
				result = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: vector }, this.groupSessionKey, data);
			} catch (error) {
				console.error('E2E -> Error encrypting message: ', error);
				return;
			}

			const cipherText = new Uint8Array(result);
			const output = new Uint8Array(vector.length + cipherText.length);
			output.set(vector, 0);
			output.set(cipherText, vector.length);
			return EJSON.stringify(output);
		} else {

			// Control should never reach here as both cases (private group and direct) have been covered above.
			// This is for future, in case of Signal integration.
			return this.cipher.encrypt(data).then((ciphertext) => toString(ciphertext.body));
		}
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
		if (this.typeOfRoom === 'p' || this.typeOfRoom === 'd') {
			let cipherText = EJSON.parse(message);
			// let cipherText = message;
			const vector = cipherText.slice(0, 16);
			cipherText = cipherText.slice(16);
			window.vector = vector;
			window.cipherText = cipherText;
			let result;
			window.groupSessionKey = this.groupSessionKey;
			try {
				result = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: vector }, this.groupSessionKey, cipherText);
			} catch (error) {
				console.error('E2E -> Error decrypting message: ', error, message);
				return false;
			}
			return EJSON.parse(toString(result));

		} else {

			// Control should never reach here as both cases (private group and direct) have been covered above.
			// This is for future, in case of Signal integration.
			const ciphertext = toArrayBuffer(message);
			let plaintext;
			try {
				plaintext = await this.cipher.decryptWhisperMessage(ciphertext, 'binary');
			} catch (error) {
				console.error('E2E -> Error decrypting whisper message: ', error);
				return false;
			}

			plaintext = EJSON.parse(toString(plaintext));
			return plaintext;
		}
	}

	async onUserStream(type) {
		switch (type) {
			case 'end':
				if (this.established.get()) {
					this.reset();
					modal.open({
						title: `<i class='icon-key alert-icon failure-color'></i>${ TAPi18n.__('E2E') }`,
						text: TAPi18n.__('The E2E session was ended'),
						html: true,
					});
				}
				break;

			case 'clearGroupKey':
				if (this.established.get()) {
					this.reset();
					modal.open({
						title: `<i class='icon-key alert-icon failure-color'></i>${ TAPi18n.__('E2E') }`,
						text: TAPi18n.__('The E2E session key was cleared. Session has now ended.'),
						html: true,
					});
				}
				break;
		}
	}
}
