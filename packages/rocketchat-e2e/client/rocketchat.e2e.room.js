/* eslint-disable no-undef */

// import toastr from 'toastr';
/* globals crypto */

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


		this.keyPair = null;
		this.exportedPublicKey = null;
		this.sessionKey = null;


		// Keys needed by Signal Protocol
		this.peerIdentityKey = null;
		this.peerPreKey = null;
		this.peerSignedPreKey = null;
		this.peerSignedSignature = null;
	}

	// Initiates E2E Encryption
	handshake(startSession, refresh) {
		console.log('Initiating handshake');
		const self = this;
		this.establishing.set(true);

		// Cover private groups and direct messages
		if (this.typeOfRoom === 'p' || this.typeOfRoom === 'd') {
			console.log('doing something');
			const sessionKey = new Promise((resolve) => {

				// Fetch encrypted session key from subscription model
				Meteor.call('fetchGroupE2EKey', self.roomId, function(error, result) {
					if (result !== null && result !== undefined && refresh !== true) {
						let cipherText = EJSON.parse(result);
						const vector = cipherText.slice(0, 16);
						cipherText = cipherText.slice(16);
						console.log('encrypted key obtained');

						// Decrypt obtained encrypted session key
						decrypt_promise = crypto.subtle.decrypt({name: 'RSA-OAEP', iv: vector}, RocketChat.E2EStorage.get('RSA-PrivKey'), cipherText);
						decrypt_promise.then(function(result) {

							self.exportedSessionKey = ab2str(result);

							// Import session key for use.
							crypto.subtle.importKey('jwk', EJSON.parse(self.exportedSessionKey), {name: 'AES-CBC', iv: vector}, true, ['encrypt', 'decrypt']).then(function(key) {
								console.log('key imported');
								// Key has been obtained. E2E is now in session.
								self.groupSessionKey = key;
								self.established.set(true);
								self.establishing.set(false);
								resolve(true);
							});
						});

						decrypt_promise.catch((err) => {
							console.log(err.name);
						});
					}					else {
						// Could not obtain session key from server.
						resolve(false);
					}
				});

			}).then(function(val) {
				if (val === false) {
					// Session key does not exist on the server. Generating new.
					console.log('generate new key');
					RocketChat.E2E.crypto.generateKey({name: 'AES-CBC', length: 128}, true, ['encrypt', 'decrypt']).then((key) => {
						self.groupSessionKey = key;
						crypto.subtle.exportKey('jwk', key).then(function(result) {
							self.exportedSessionKey = JSON.stringify(result);
						});
					}).then(() => {
						self.establishing.set(false);
						self.established.set(true);
						console.log('reached here');
						// Encrypt generated session key for every user in room and publish to subscription model.
						Meteor.call('getUsersOfRoom', self.roomId, true, function(error, result) {
							result.records.forEach(function(user) {

								// Fetch public key for this user in room
								Meteor.call('fetchKeychain', user._id, function(error, keychain) {
									const key = JSON.parse(keychain);
									if (key['RSA-PubKey']) {
										crypto.subtle.importKey('jwk', JSON.parse(key['RSA-PubKey']), {name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: {name: 'SHA-256'}}, true, ['encrypt']).then(function(user_key) {
											const vector = crypto.getRandomValues(new Uint8Array(16));

											// Encrypt session key for this user with his/her public key
											encrypt_promise = crypto.subtle.encrypt({name: 'RSA-OAEP', iv: vector}, user_key, str2ab(self.exportedSessionKey));
											encrypt_promise.then(function(result) {
												cipherText = new Uint8Array(result);
												const output = new Uint8Array(vector.length + cipherText.length);
												output.set(vector, 0);
												output.set(cipherText, vector.length);

												// Key has been encrypted. Publish to that user's subscription model for this room.
												Meteor.call('updateGroupE2EKey', self.roomId, user._id, EJSON.stringify(output), function(error, result) {
													console.log('E2E key saved.');
													console.log(result);
												});
											});
										});
									}
								});
							});
						});
					});
				}
			});

			sessionKey.catch((err) => {
				console.log(err);
			});

		}
	}


	// Clears the session key in use by room
	clearGroupKey(refresh) {
		const self = this;

		// For every user in room...
		Meteor.call('getUsersOfRoom', self.roomId, true, function(error, result) {
			result.records.forEach(function(user) {

				// ...remove session key for this room
				Meteor.call('updateGroupE2EKey', self.roomId, user._id, null, function(error, result) {
					console.log(result);
					RocketChat.Notifications.notifyUser(user._id, 'e2e', 'clearGroupKey', { roomId: self.roomId, userId: self.userId });
					if (refresh) {
						// Generate new key.
					}
				});
			});
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
	encryptFile(fileArrayBuffer) {
		if (this.typeOfRoom === 'p' || this.typeOfRoom === 'd') {
			const vector = crypto.getRandomValues(new Uint8Array(16));
			return crypto.subtle.encrypt({name: 'AES-CBC', iv: vector}, this.groupSessionKey, fileArrayBuffer).then((result) => {
				cipherText = new Uint8Array(result);
				const output = new Uint8Array(vector.length + cipherText.length);
				output.set(vector, 0);
				output.set(cipherText, vector.length);
				return str2ab(EJSON.stringify(output));
			});
		}
	}


	// Decrypt uploaded encrypted files. I/O is in arraybuffers.
	decryptFile(message) {
		let cipherText = EJSON.parse(message);
		const vector = cipherText.slice(0, 16);
		cipherText = cipherText.slice(16);
		return crypto.subtle.decrypt({name: 'AES-CBC', iv: vector}, this.groupSessionKey, cipherText).then((result) => {
			return result;
		})
			.catch((e) => {
				console.log(e);
				// Session key was reset. Cannot decrypt this file anymore.
				swal({
					title: `<i class='icon-key alert-icon failure-color'></i>${ TAPi18n.__('E2E') }`,
					text: TAPi18n.__('Some messages cannot be decrypted because session key was reset.'),
					html: true
				});
				return false;
			});
	}


	// Encrypts messages
	encryptText(data) {
		if (!_.isObject(data)) {
			data = new TextEncoder('UTF-8').encode(EJSON.stringify({ text: data, ack: Random.id((Random.fraction()+1)*20) }));
		}
		if (this.typeOfRoom === 'p' || this.typeOfRoom === 'd') {
			const vector = crypto.getRandomValues(new Uint8Array(16));
			return crypto.subtle.encrypt({name: 'AES-CBC', iv: vector}, this.groupSessionKey, data).then((result) => {
				cipherText = new Uint8Array(result);
				const output = new Uint8Array(vector.length + cipherText.length);
				output.set(vector, 0);
				output.set(cipherText, vector.length);
				return EJSON.stringify(output);
			});
		}		else {

			// Control should never reach here as both cases (private group and direct) have been covered above.
			// This is for future, in case of Signal integration.

			return this.cipher.encrypt(data).then((ciphertext) => {
				return ab2str(ciphertext.body);
			});
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
			ack: Random.id((Random.fraction()+1)*20),
			ts
		}));
		const enc = this.encryptText(data);
		return enc;
	}


	// Decrypt messages
	decrypt(message) {
		if (this.typeOfRoom === 'p' || this.typeOfRoom === 'd') {
			let cipherText = EJSON.parse(message);
			const vector = cipherText.slice(0, 16);
			cipherText = cipherText.slice(16);
			return crypto.subtle.decrypt({name: 'AES-CBC', iv: vector}, this.groupSessionKey, cipherText).then((result) => {
				return EJSON.parse(ab2str(result));
			})
				.catch((e) => {
					console.log(e);

					// Session key was reset. Cannot decrypt this message anymore.
					return false;
				});

		}		else {

			// Control should never reach here as both cases (private group and direct) have been covered above.
			// This is for future, in case of Signal integration.
			const ciphertext = str2ab(message);
			return this.cipher.decryptWhisperMessage(ciphertext, 'binary').then((plaintext) => {
				plaintext = EJSON.parse(ab2str(plaintext));
				return plaintext;
			});
		}
	}


	// Decrypts first message after signal session establishment by peer.
	// According to signal protocol, needs to be handled differently as this message contains session establishment information.
	decryptInitial(message) {

		// Control should never reach here as both cases (private group and direct) have been covered above.
		// This is for future, in case of Signal integration.
		const ciphertext = str2ab(message);
		const self = this;
		return new Promise((resolve) => {

			// Get signal keys for the peer.
			Meteor.call('fetchKeychain', this.peerId, function(error, result) {
				const key = JSON.parse(result);
				self.peerIdentityKey = key.lastUsedIdentityKey;
				for (let i=0; i<key.publicKeychain.length; i++) {
					if (key.publicKeychain[i][0] === self.peerIdentityKey) {
						self.peerSignedPreKey = str2ab(key.publicKeychain[i][1]);
						self.peerSignedSignature = str2ab(key.publicKeychain[i][2]);
						self.peerPreKey = str2ab(key.publicKeychain[i][3]);
						self.peerRegistrationId = key.publicKeychain[i][4];
						break;
					}
				}
				self.peerIdentityKey = str2ab(self.peerIdentityKey);

				// Establish a signal session.
				const bAddress = new libsignal.SignalProtocolAddress(self.peerRegistrationId, 1);
				self.cipher = new libsignal.SessionCipher(RocketChat.E2EStorage, bAddress);
				self.establishing.set(false);
				self.established.set(true);

				// Decrypt initial signal message using `decryptPreKeyWhisperMessage`
				return self.cipher.decryptPreKeyWhisperMessage(ciphertext, 'binary').then((plaintext) => {
					plaintext = EJSON.parse(ab2str(plaintext));
					resolve(plaintext);
				});

			});
		});
	}


	onUserStream(type, data) {
		switch (type) {
			case 'acknowledge':
				// Control should never reach here as both cases (private group and direct) have been covered above.
				// This is for future, in case of Signal integration.
				this.established.set(true);
				// GET THE OTHER'S KEY
				Meteor.call('fetchKeychain', data.userId, function(error, key) {
					this.peerIdentityKey = key.lastUsedIdentityKey;
					for (let i=0; i<key.publicKeychain.length; i++) {
						if (key.publicKeychain[i][0] === this.peerIdentityKey) {
							this.peerSignedPreKey = key.publicKeychain[i][1];
							this.peerSignedSignature = key.publicKeychain[i][2];
							this.peerPreKey = key.publicKeychain[i][3];
							break;
						}
					}
				});
				break;

			case 'end':
				if (this.established.get()) {
					this.reset();
					swal({
						title: `<i class='icon-key alert-icon failure-color'></i>${ TAPi18n.__('E2E') }`,
						text: TAPi18n.__('The E2E session was ended'),
						html: true
					});
				}
				break;

			case 'clearGroupKey':
				if (this.established.get()) {
					this.reset();
					swal({
						title: `<i class='icon-key alert-icon failure-color'></i>${ TAPi18n.__('E2E') }`,
						text: TAPi18n.__('The E2E session key was cleared. Session has now ended.'),
						html: true
					});
				}
		}
	}
};
