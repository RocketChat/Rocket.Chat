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
		console.log("Room created!");
		this.userId = userId;
		this.roomId = roomId;
		this.typeOfRoom = t;
		this.peerId = roomId.replace(userId, '');
		this.established = new ReactiveVar(false);
		this.establishing = new ReactiveVar(false);

		this.userOnlineComputation = null;

		this.keyPair = null;
		this.exportedPublicKey = null;
		this.sessionKey = null;

		this.peerIdentityKey = null;
		this.peerPreKey = null;
		this.peerSignedPreKey = null;
		this.peerSignedSignature = null;
	}

	handshake(startSession) {
		const self = this;
		this.establishing.set(true);
		console.log(this);
		if (this.typeOfRoom == 'p') {
			RocketChat.E2E.crypto.generateKey({name: "AES-CBC", length: 128}, false, ["encrypt", "decrypt"]).then((key) => {
				self.groupSessionKey = key;
			}).then(() => {
				// RocketChat.Notifications.notifyUser(this.peerId, 'otr', 'handshake', { roomId: this.roomId, userId: this.userId, publicKey: EJSON.stringify(this.exportedPublicKey), refresh });
				self.firstPeer = true;
				self.establishing.set(false);
				self.established.set(true);
				console.log("Group session key generated!");
				Meteor.call('getUsersOfRoom', self.roomId, true, function(error, result) {
					console.log(result);
					result.records.forEach(function(user) {
						console.log("Fetching for: "+user.name);
						Meteor.call('fetchKeychain', user._id, function(error, keychain) {
							let key = JSON.parse(keychain);
							key = key.lastUsedIdentityKey;
						});
					});
				});
			});
		} else {
			let key;
			Meteor.call('fetchKeychain', this.peerId, function(error, result) {
				key = JSON.parse(result);
				console.log(key);
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
				console.log(`Obtained keys: ${ ab2str(self.peerIdentityKey) }, ${ ab2str(self.peerSignedPreKey) }, ${ ab2str(self.peerSignedSignature) }`);
				if (startSession) {
					self.firstPeer = true;
					self.start_session();
				}
			});
		}
		// RocketChat.Notifications.notifyUser(this.peerId, 'e2e', 'handshake', { roomId: this.roomId, userId: this.userId, refresh });
	}


	start_session() {
		const bAddress = new libsignal.SignalProtocolAddress(this.peerRegistrationId, 1);
		console.log(this.peerIdentityKey);
		const sessionBuilder = new libsignal.SessionBuilder(RocketChat.E2EStorage, bAddress);

		const self = this;

		const promise = sessionBuilder.processPreKey({
			identityKey: self.peerIdentityKey,
			registrationId : self.peerRegistrationId,
			preKey:  {
				keyId     : self.peerRegistrationId,
				publicKey : self.peerPreKey
			},
			signedPreKey: {
				keyId     : self.peerRegistrationId,
				publicKey : self.peerSignedPreKey,
				signature : self.peerSignedSignature
			}
		});

		promise.then(function onsuccess() {
			console.log('Successfully created session');
			self.establishing.set(false);
			self.established.set(true);
			self.cipher = new libsignal.SessionCipher(RocketChat.E2EStorage, bAddress);
		});

		promise.catch(function onerror(error) {
			console.log(error);
		});
	}


	acknowledge() {
		RocketChat.Notifications.notifyUser(this.peerId, 'e2e', 'acknowledge', { roomId: this.roomId, userId: this.userId });
	}

	deny() {
		this.reset();
		RocketChat.Notifications.notifyUser(this.peerId, 'e2e', 'deny', { roomId: this.roomId, userId: this.userId });
	}

	end() {
		this.reset();
		RocketChat.Notifications.notifyUser(this.peerId, 'e2e', 'end', { roomId: this.roomId, userId: this.userId });
	}

	reset() {
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
		this.peerPreKey = null;
	}

	generateKeyPair() {
		let self = this;
		return 

	}

	encryptText(data) {
		if (!_.isObject(data)) {
			data = new TextEncoder('UTF-8').encode(EJSON.stringify({ text: data, ack: Random.id((Random.fraction()+1)*20) }));
		}
		console.log('Encrypting...');
		if (this.typeOfRoom == 'p') {
			var vector = crypto.getRandomValues(new Uint8Array(16));
			// data = EJSON.stringify(data);
			// console.log(str2ab(data));
			console.log(data);
			return crypto.subtle.encrypt({name: "AES-CBC", iv: vector}, this.groupSessionKey, data).then((result) => {
				cipherText = new Uint8Array(result);
				const output = new Uint8Array(vector.length + cipherText.length);
				output.set(vector, 0);
				output.set(cipherText, vector.length);
				return EJSON.stringify(output);
			});
		} else {
			return this.cipher.encrypt(data).then((ciphertext) => {
				console.log('Message sent: ', EJSON.stringify(ciphertext.body));
				console.log(ciphertext);
				return ab2str(ciphertext.body);
			});
		}
		// const iv = crypto.getRandomValues(new Uint8Array(12));

		// return RocketChat.E2E.crypto.encrypt({
		// 	name: 'AES-GCM',
		// 	iv
		// }, this.sessionKey, data).then((cipherText) => {
		// 	cipherText = new Uint8Array(cipherText);
		// 	const output = new Uint8Array(iv.length + cipherText.length);
		// 	output.set(iv, 0);
		// 	output.set(cipherText, iv.length);
		// 	return EJSON.stringify(output);
		// }).catch(() => {
		// 	throw new Meteor.Error('encryption-error', 'Encryption error.');
		// });
	}

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

	decrypt(message) {
		console.log(`MESSAGE RECEIVED: ${ message }`);
		// const ciphertext = str2ab(message);
		// console.log(ciphertext);
		let cipherText = EJSON.parse(message);
		const vector = cipherText.slice(0, 16);
		cipherText = cipherText.slice(16);
		console.log(cipherText)
		if (this.typeOfRoom == "p") {
			return crypto.subtle.decrypt({name: "AES-CBC", iv: vector}, this.groupSessionKey, cipherText).then((result) => {
				console.log(result);
				console.log(EJSON.parse(ab2str(result)));
				return EJSON.parse(ab2str(result));
			});
		} else {
			return this.cipher.decryptWhisperMessage(ciphertext, 'binary').then((plaintext) => {
				console.log(`CHECK THIS: ${ ab2str(plaintext) }`);
				// return ab2str(plaintext);
				plaintext = EJSON.parse(ab2str(plaintext));
				return plaintext;
				// console.log("CHECK THIS: "+ab2str(plaintext));
				// return ab2str(plaintext);
			});
		}

		// let cipherText = EJSON.parse(message);
		// const iv = cipherText.slice(0, 12);
		// cipherText = cipherText.slice(12);

		// return RocketChat.E2E.crypto.decrypt({
		// 	name: 'AES-GCM',
		// 	iv
		// }, this.sessionKey, cipherText)
		// 	.then((data) => {
		// 		data = EJSON.parse(new TextDecoder('UTF-8').decode(new Uint8Array(data)));
		// 		return data;
		// 	})
		// 	.catch((e) => {
		// 		// toastr.error(e);
		// 		console.log(e);
		// 		return message;
		// 	});
	}

	decryptInitial(message) {
		console.log(`MESSAGE RECEIVED: ${ message }`);
		const ciphertext = str2ab(message);
		console.log(ciphertext);
		const self = this;
		return new Promise((resolve) => {
			Meteor.call('fetchKeychain', this.peerId, function(error, result) {
				const key = JSON.parse(result);
				console.log(key);
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
				console.log(`Obtained keys: ${ ab2str(self.peerIdentityKey) }, ${ ab2str(self.peerSignedPreKey) }, ${ ab2str(self.peerSignedSignature) }`);
				const bAddress = new libsignal.SignalProtocolAddress(self.peerRegistrationId, 1);
				self.cipher = new libsignal.SessionCipher(RocketChat.E2EStorage, bAddress);
				self.establishing.set(false);
				self.established.set(true);
				return self.cipher.decryptPreKeyWhisperMessage(ciphertext, 'binary').then((plaintext) => {
					console.log(`CHECK THIS: ${ ab2str(plaintext) }`);
					// return ab2str(plaintext);
					plaintext = EJSON.parse(ab2str(plaintext));
					resolve(plaintext);
				});

			});
		});
	}

	onUserStream(type, data) {
		const user = Meteor.users.findOne(data.userId);
		switch (type) {
			case 'handshake':
				let timeout = null;

				const establishConnection = () => {
					this.establishing.set(true);
					Meteor.clearTimeout(timeout);
					this.firstPeer = false;
					FlowRouter.goToRoomById(data.roomId);
					Meteor.defer(() => {
						this.established.set(true);
						this.acknowledge();
					});


				};

				if (data.refresh && this.established.get()) {
					this.reset();
					establishConnection();
				} else {
					if (this.established.get()) {
						this.reset();
					}

					swal({
						title: `<i class='icon-key alert-icon success-color'></i>${ TAPi18n.__('OTR') }`,
						text: TAPi18n.__('Username_wants_to_start_otr_Do_you_want_to_accept', { username: user.username }),
						html: true,
						showCancelButton: true,
						allowOutsideClick: false,
						confirmButtonText: TAPi18n.__('Yes'),
						cancelButtonText: TAPi18n.__('No')
					}, (isConfirm) => {
						if (isConfirm) {
							establishConnection();
						} else {
							Meteor.clearTimeout(timeout);
							this.deny();
						}
					});
				}

				timeout = Meteor.setTimeout(() => {
					this.establishing.set(false);
					swal.close();
				}, 10000);

				break;

			case 'acknowledge':
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

			case 'deny':
				if (this.establishing.get()) {
					this.reset();
					const user = Meteor.users.findOne(this.peerId);
					swal({
						title: `<i class='icon-key alert-icon success-color'></i>${ TAPi18n.__('E2E') }`,
						text: TAPi18n.__('Username_denied_the_OTR_session', { username: user.username }),
						html: true
					});
				}
				break;

			case 'end':
				if (this.established.get()) {
					this.reset();
					const user = Meteor.users.findOne(this.peerId);
					swal({
						title: `<i class='icon-key alert-icon success-color'></i>${ TAPi18n.__('E2E') }`,
						text: TAPi18n.__('Username_ended_the_OTR_session', { username: user.username }),
						html: true
					});
				}
				break;
		}
	}
};
