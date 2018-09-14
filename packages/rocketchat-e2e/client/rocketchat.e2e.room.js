/* eslint-disable no-undef */

// import toastr from 'toastr';
/* globals crypto */

import { call } from 'meteor/rocketchat:lib';

function ab2str(buf) {
	return RocketChat.signalUtils.toString(buf);
}

function str2ab(str) {
	return RocketChat.signalUtils.toArrayBuffer(str);
}

RocketChat.E2E.Room = class {
	constructor(userId, roomId, t) {
		this.userId = userId;
		this.roomId = roomId;
		this.typeOfRoom = t;
		this.peerId = roomId.replace(userId, '');
		this.established = new ReactiveVar(false);
		this.establishing = new ReactiveVar(false);

		// Keys needed by Signal Protocol
		this.peerIdentityKey = null;
		this.peerPreKey = null;
		this.peerSignedPreKey = null;
		this.peerSignedSignature = null;
	}

	// Initiates E2E Encryption
	async handshake(refresh) {
		console.log('E2E -> Initiating handshake');
		this.establishing.set(true);

		// Cover private groups and direct messages
		if (this.typeOfRoom === 'p' || this.typeOfRoom === 'd') {

			// Fetch encrypted session key from subscription model
			let groupKey;
			try {
				groupKey = await call('fetchGroupE2EKey', this.roomId);
			} catch (error) {
				console.log('E2E -> Error fetching group key: ', error);
				return;
			}

			if (!groupKey || refresh) {
				// Create group key
				let key;
				try {
					key = await RocketChat.E2E.crypto.generateKey({ name: 'AES-CBC', length: 128 }, true, ['encrypt', 'decrypt']);
				} catch (error) {
					console.log('E2E -> Error generating group key: ', error);
					return;
				}
				this.groupSessionKey = key;

				let exportedSessionKey;
				try {
					exportedSessionKey = await crypto.subtle.exportKey('jwk', key);
				} catch (error) {
					console.log('E2E -> Error exporting group key: ', error);
					return;
				}
				this.exportedSessionKey = JSON.stringify(exportedSessionKey);
				this.establishing.set(false);
				this.established.set(true);

				// Encrypt generated session key for every user in room and publish to subscription model.
				let users;
				try {
					users = await call('getUsersOfRoom', this.roomId, true);
				} catch (error) {
					console.log('E2E -> Error getting room users: ', error);
					return;
				}

				users.records.forEach(async(user) => {
					let keychain;
					try {
						keychain = await call('fetchKeychain', user._id);
					} catch (error) {
						console.log('E2E -> Error fetching user keychain: ', error);
						return;
					}

					const key = JSON.parse(keychain);
					if (key['RSA-PubKey']) {
						let userKey;
						try {
							userKey = await crypto.subtle.importKey('jwk', JSON.parse(key['RSA-PubKey']), { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: { name: 'SHA-256' } }, true, ['encrypt']);
						} catch (error) {
							console.log('E2E -> Error importing user key: ', error);
							return;
						}
						const vector = crypto.getRandomValues(new Uint8Array(16));

						// Encrypt session key for this user with his/her public key
						let encryptedUserKey;
						try {
							encryptedUserKey = await crypto.subtle.encrypt({ name: 'RSA-OAEP', iv: vector }, userKey, str2ab(this.exportedSessionKey));
						} catch (error) {
							console.log('E2E -> Error encrypting user key: ', error);
							return;
						}
						cipherText = new Uint8Array(encryptedUserKey);
						const output = new Uint8Array(vector.length + cipherText.length);
						output.set(vector, 0);
						output.set(cipherText, vector.length);

						// Key has been encrypted. Publish to that user's subscription model for this room.
						await call('updateGroupE2EKey', this.roomId, user._id, EJSON.stringify(output));
					}
				});
			} else {
				// Get existing group key
				let cipherText = EJSON.parse(groupKey);
				const vector = cipherText.slice(0, 16);
				cipherText = cipherText.slice(16);

				// Decrypt obtained encrypted session key
				let decryptedKey;
				try {
					decryptedKey = await crypto.subtle.decrypt({ name: 'RSA-OAEP', iv: vector }, RocketChat.E2EStorage.get('RSA-PrivKey'), cipherText);
				} catch (error) {
					console.log('E2E -> Error decrypting group key: ', error);
					return;
				}
				this.exportedSessionKey = ab2str(decryptedKey);

				// Import session key for use.
				let key;
				try {
					key = await crypto.subtle.importKey('jwk', EJSON.parse(this.exportedSessionKey), { name: 'AES-CBC', iv: vector }, true, ['encrypt', 'decrypt']);
				} catch (error) {
					console.log('E2E -> Error importing group key: ', error);
					return;
				}

				// Key has been obtained. E2E is now in session.
				this.groupSessionKey = key;
				this.established.set(true);
				this.establishing.set(false);
				return true;
			}
		}
	}


	// Clears the session key in use by room
	async clearGroupKey() {

		// For every user in room...
		let users;
		try {
			users = await call('getUsersOfRoom', this.roomId, true);
		} catch (error) {
			console.log('E2E -> Error getting room users: ', error);
			return;
		}
		users.records.forEach(async(user) => {
			// ...remove session key for this room
			try {
				await call('updateGroupE2EKey', this.roomId, user._id, null);
			} catch (error) {
				console.log('E2E -> Error clearing room key: ', error);
				return;
			}
			RocketChat.Notifications.notifyUser(user._id, 'e2e', 'clearGroupKey', { roomId: this.roomId, userId: this.userId });
		});
	}


	// Stop E2E session.
	end() {
		this.reset();
		RocketChat.Notifications.notifyUser(this.peerId, 'e2e', 'end', { roomId: this.roomId, userId: this.userId });
	}


	// Reset E2E session.
	reset(refresh) {
		this.establishing.set(false);
		this.established.set(false);
		this.keyPair = null;
		this.exportedPublicKey = null;
		this.sessionKey = null;
		this.cipher = null;
		RocketChat.E2EStorage.removeSession(`${ this.peerRegistrationId }.1`);
		this.peerIdentityKey = null;
		this.peerRegistrationId = null;
		this.peerSignedPreKey = null;
		this.peerSignedSignature = null;
		this.groupSessionKey = null;
		this.peerPreKey = null;
		this.clearGroupKey(refresh);		// Might enter a race condition with the handshake function.
	}


	// Encrypts files before upload. I/O is in arraybuffers.
	async encryptFile(fileArrayBuffer) {
		if (this.typeOfRoom === 'p' || this.typeOfRoom === 'd') {
			const vector = crypto.getRandomValues(new Uint8Array(16));
			let result;
			try {
				result = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: vector }, this.groupSessionKey, fileArrayBuffer);
			} catch (error) {
				console.log('E2E -> Error encrypting group key: ', error);
				return;
			}

			cipherText = new Uint8Array(result);
			const output = new Uint8Array(vector.length + cipherText.length);
			output.set(vector, 0);
			output.set(cipherText, vector.length);
			return str2ab(EJSON.stringify(output));
		}
	}


	// Decrypt uploaded encrypted files. I/O is in arraybuffers.
	async decryptFile(message) {
		let cipherText = EJSON.parse(message);
		const vector = cipherText.slice(0, 16);
		cipherText = cipherText.slice(16);
		try {
			return await crypto.subtle.decrypt({ name: 'AES-CBC', iv: vector }, this.groupSessionKey, cipherText);
		} catch (error) {
			console.log('E2E -> Error decrypting file: ', error);
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
				console.log('E2E -> Error encrypting message: ', error);
				return;
			}

			cipherText = new Uint8Array(result);
			const output = new Uint8Array(vector.length + cipherText.length);
			output.set(vector, 0);
			output.set(cipherText, vector.length);
			return EJSON.stringify(output);
		} else {

			// Control should never reach here as both cases (private group and direct) have been covered above.
			// This is for future, in case of Signal integration.
			return this.cipher.encrypt(data).then((ciphertext) => ab2str(ciphertext.body));
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
			let result;
			window.groupSessionKey = this.groupSessionKey;
			try {
				result = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: vector }, this.groupSessionKey, cipherText);
			} catch (error) {
				console.log('E2E -> Error decrypting message: ', error, message);
				return false;
			}
			return EJSON.parse(ab2str(result));

		} else {

			// Control should never reach here as both cases (private group and direct) have been covered above.
			// This is for future, in case of Signal integration.
			const ciphertext = str2ab(message);
			let plaintext;
			try {
				plaintext = await this.cipher.decryptWhisperMessage(ciphertext, 'binary');
			} catch (error) {
				console.log('E2E -> Error decrypting whisper message: ', error);
				return false;
			}

			plaintext = EJSON.parse(ab2str(plaintext));
			return plaintext;
		}
	}


	// Decrypts first message after signal session establishment by peer.
	// According to signal protocol, needs to be handled differently as this message contains session establishment information.
	async decryptInitial(message) {

		// Control should never reach here as both cases (private group and direct) have been covered above.
		// This is for future, in case of Signal integration.
		const ciphertext = str2ab(message);

		// Get signal keys for the peer.
		let keychain;
		try {
			keychain = await call('fetchKeychain', this.peerId);
		} catch (error) {
			console.log('E2E -> Error fetching keychain: ', error);
			return;
		}

		const key = JSON.parse(keychain);
		this.peerIdentityKey = key.lastUsedIdentityKey;
		for (let i = 0; i < key.publicKeychain.length; i++) {
			if (key.publicKeychain[i][0] === this.peerIdentityKey) {
				this.peerSignedPreKey = str2ab(key.publicKeychain[i][1]);
				this.peerSignedSignature = str2ab(key.publicKeychain[i][2]);
				this.peerPreKey = str2ab(key.publicKeychain[i][3]);
				this.peerRegistrationId = key.publicKeychain[i][4];
				break;
			}
		}
		this.peerIdentityKey = str2ab(this.peerIdentityKey);

		// Establish a signal session.
		const bAddress = new libsignal.SignalProtocolAddress(this.peerRegistrationId, 1);
		this.cipher = new libsignal.SessionCipher(RocketChat.E2EStorage, bAddress);
		this.establishing.set(false);
		this.established.set(true);

		// Decrypt initial signal message using `decryptPreKeyWhisperMessage`
		let plaintext;
		try {
			plaintext = await this.cipher.decryptPreKeyWhisperMessage(ciphertext, 'binary');
		} catch (error) {
			console.log('E2E -> Error decrypting whisper message: ', error);
			return;
		}
		plaintext = EJSON.parse(ab2str(plaintext));
		return plaintext;
	}


	async onUserStream(type, data) {
		switch (type) {
			case 'acknowledge':
				// Control should never reach here as both cases (private group and direct) have been covered above.
				// This is for future, in case of Signal integration.
				this.established.set(true);
				// Get the other's key
				let key;
				try {
					key = await call('fetchKeychain', data.userId);
				} catch (error) {
					console.log('E2E -> Error fetching keychain: ', error);
					return;
				}

				this.peerIdentityKey = key.lastUsedIdentityKey;
				for (let i = 0; i < key.publicKeychain.length; i++) {
					if (key.publicKeychain[i][0] === this.peerIdentityKey) {
						this.peerSignedPreKey = key.publicKeychain[i][1];
						this.peerSignedSignature = key.publicKeychain[i][2];
						this.peerPreKey = key.publicKeychain[i][3];
						break;
					}
				}
				break;

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
};
