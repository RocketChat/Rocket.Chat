/* eslint-disable no-undef */

function ab2str(buf) {
	return RocketChat.signalUtils.toString(buf);
}

function str2ab(str) {
	return RocketChat.signalUtils.toArrayBuffer(str);
}

// Save keypair to browser's localstorage
function saveKeyToLS(keyID, keyPair) {
	localStorage.setItem(keyID, JSON.stringify({'pubKey': ab2str(keyPair.pubKey), 'privKey': ab2str(keyPair.privKey)}));
}

// Fetch keypair from browser's localstorage
function getKeyFromLS(keyID) {
	const key = localStorage.getItem(keyID);
	const keyPair = JSON.parse(key);
	keyPair.pubKey = str2ab(keyPair.pubKey);
	keyPair.privKey = str2ab(keyPair.privKey);
	return keyPair;
}

// Load the keypairs from localstorage to make them ready for use.
function loadKeyGlobalsFromLS() {

	// Signal keys
	RocketChat.E2EStorage.put('registrationId', parseInt(localStorage.getItem('registrationId')));
	RocketChat.E2EStorage.put('identityKey', getKeyFromLS('identityKey'));
	RocketChat.E2EStorage.storePreKey(RocketChat.E2EStorage.get('registrationId'), getKeyFromLS('preKey'));
	RocketChat.E2EStorage.storeSignedPreKey(RocketChat.E2EStorage.get('registrationId'), getKeyFromLS('signedPreKey'));
	RocketChat.E2EStorage.put(`signedPreKeySignature${ RocketChat.E2EStorage.get('registrationId') }`, str2ab(localStorage.getItem('signedPreKeySignature')));

	// E2E's public-private keypairs
	crypto.subtle.importKey('jwk', JSON.parse(localStorage.getItem('RSA-PrivKey')), {name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: {name: 'SHA-256'}}, true, ['decrypt']).then(function(key) {
		RocketChat.E2EStorage.put('RSA-PrivKey', key);
	});

	crypto.subtle.importKey('jwk', JSON.parse(localStorage.getItem('RSA-PubKey')), {name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: {name: 'SHA-256'}}, true, ['encrypt']).then(function(key) {
		RocketChat.E2EStorage.put('RSA-PubKey', key);
	});

	// Store public keys in server
	Meteor.call('addKeyToChain', {
		'identityKey': ab2str(RocketChat.E2EStorage.get('identityKey').pubKey),
		'preKey': ab2str(RocketChat.E2EStorage.loadPreKey(RocketChat.E2EStorage.get('registrationId')).pubKey),
		'signedPreKey': ab2str(RocketChat.E2EStorage.loadSignedPreKey(RocketChat.E2EStorage.get('registrationId')).pubKey),
		'signedPreKeySignature': ab2str(RocketChat.E2EStorage.get(`signedPreKeySignature${ RocketChat.E2EStorage.get('registrationId') }`)),
		'registrationId': RocketChat.E2EStorage.get('registrationId'),
		'RSA-PubKey': localStorage.getItem('RSA-PubKey')
	});
}

class E2E {
	constructor() {
		this.enabled = new ReactiveVar(false);
		this.instancesByRoomId = {};
	}

	isEnabled() {
		return this.enabled.get();
	}

	getInstanceByRoomId(roomId) {
		if (!this.enabled.get()) {
			return;
		}

		if (this.instancesByRoomId[roomId]) {
			return this.instancesByRoomId[roomId];
		}

		const subscription = RocketChat.models.Subscriptions.findOne({
			rid: roomId
		});

		if (!subscription || (subscription.t !== 'd' && subscription.t !== 'p')) {
			return;
		}

		this.instancesByRoomId[roomId] = new RocketChat.E2E.Room(Meteor.userId(), roomId, subscription.t);
		return this.instancesByRoomId[roomId];
	}

	startClient() {
		// To reset all keys (local and on server):
		//   Meteor.call("emptyKeychain");
		//   RocketChat.E2EStorage.store = {}
		//   localStorage.clear();

		// This is a new device for signal encryption
		if (localStorage.getItem('registrationId') == null) {
			const KeyHelper = libsignal.KeyHelper;
			const registrationId = KeyHelper.generateRegistrationId();
			localStorage.setItem('registrationId', registrationId);

			KeyHelper.generateIdentityKeyPair().then(function(identityKeyPair) {
				saveKeyToLS('identityKey', identityKeyPair);

				KeyHelper.generatePreKey(registrationId).then(function(preKey) {
					saveKeyToLS('preKey', preKey.keyPair);
				});

				KeyHelper.generateSignedPreKey(getKeyFromLS('identityKey'), registrationId).then(function(signedPreKey) {
					saveKeyToLS('signedPreKey', signedPreKey.keyPair);
					localStorage.setItem('signedPreKeySignature', ab2str(signedPreKey.signature));

					promise_key = crypto.subtle.generateKey({name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: {name: 'SHA-256'}}, true, ['encrypt', 'decrypt']);
					promise_key.then(function(key) {
						crypto.subtle.exportKey('jwk', key.publicKey).then(function(result) {
							localStorage.setItem('RSA-PubKey', JSON.stringify(result));
							crypto.subtle.exportKey('jwk', key.privateKey).then(function(result) {
								// All signal keys have been generated and stored.
								localStorage.setItem('RSA-PrivKey', JSON.stringify(result));
								loadKeyGlobalsFromLS();
							});
						});
					});
				});
			});
		}		else {
			// This is not a new device. Load keys from browser localstorage.
			loadKeyGlobalsFromLS();
		}
	}
}

RocketChat.E2E = new E2E();

Meteor.startup(function() {
	Tracker.autorun(function() {
		if (Meteor.userId()) {
			RocketChat.E2E.startClient();
			RocketChat.Notifications.onUser('e2e', (type, data) => {
				if (!data.roomId || !data.userId || data.userId === Meteor.userId()) {
					return;
				} else {
					RocketChat.E2E.getInstanceByRoomId(data.roomId).onUserStream(type, data);
				}
			});
		}
	});

	// Encrypt messages before sending
	RocketChat.promises.add('onClientBeforeSendMessage', function(message) {
		if (message.rid && RocketChat.E2E.getInstanceByRoomId(message.rid) && RocketChat.E2E.getInstanceByRoomId(message.rid).established.get()) {
			// Should encrypt this message.
			return RocketChat.E2E.getInstanceByRoomId(message.rid).encrypt(message)
				.then((msg) => {
					message.msg = msg;
					message.t = 'e2e';
					return message;
				});
		} else {
			// Encryption is not required.
			try {
				return Promise.resolve(message);
			} catch (err) {
				console.log(err.message);
			}
		}
	}, RocketChat.promises.priority.HIGH);

	// Decrypt messages before displaying
	RocketChat.promises.add('onClientMessageReceived', function(message) {
		if (message.rid && RocketChat.E2E.getInstanceByRoomId(message.rid) && message.t === 'e2e' && !message.file) {
			const e2eRoom = RocketChat.E2E.getInstanceByRoomId(message.rid);
			if (e2eRoom.typeOfRoom === 'p' || e2eRoom.typeOfRoom === 'd') {

				// If session key exists in browser, no need to download again
				if (e2eRoom.groupSessionKey != null) {
					return e2eRoom.decrypt(message.msg).then((data) => {
						message._id = data._id;
						message.msg = data.text;
						message.ack = data.ack;
						if (data.ts) {
							message.ts = data.ts;
						}
						return message;
					});

				}				else {
					// User does not have session key. Need to download and decrypt from subscription model.
					const decryptedMsg = new Promise((resolve) => {
						Meteor.call('fetchGroupE2EKey', e2eRoom.roomId, function(error, result) {
							let cipherText = EJSON.parse(result);
							const vector = cipherText.slice(0, 16);
							cipherText = cipherText.slice(16);

							// Decrypt downloaded session key
							decrypt_promise = crypto.subtle.decrypt({name: 'RSA-OAEP', iv: vector}, RocketChat.E2EStorage.get('RSA-PrivKey'), cipherText);
							decrypt_promise.then(function(result) {
								e2eRoom.exportedSessionKey = ab2str(result);

								// Import key to make it ready for use
								crypto.subtle.importKey('jwk', EJSON.parse(e2eRoom.exportedSessionKey), {name: 'AES-CBC', iv: vector}, true, ['encrypt', 'decrypt']).then(function(key) {
									e2eRoom.groupSessionKey = key;
									e2eRoom.established.set(true);
									e2eRoom.establishing.set(false);

									// Session has been established. Decrypt received message.
									e2eRoom.decrypt(message.msg).then((data) => {
										message._id = data._id;
										message.msg = data.text;
										message.ack = data.ack;
										if (data.ts) {
											message.ts = data.ts;
										}
										resolve(message);
									});
								});
							});

							decrypt_promise.catch(function(err) {
								console.log(err);
							});

						});
					});

					return decryptedMsg;
				}
			}			else {
				// Control should never reach here as both cases (private group and direct) have been covered above.
				// This is for future, in case of Signal integration.
				const peerRegistrationId = e2eRoom.peerRegistrationId;
				const existingSession = RocketChat.E2EStorage.sessionExists(peerRegistrationId);
				if (message.notification) {
					message.msg = t('Encrypted_message');
					return Promise.resolve(message);
				} else {
					const otrRoom = RocketChat.E2E.getInstanceByRoomId(message.rid);

					// If existing signal session exists
					if (existingSession) {
						return otrRoom.decrypt(message.msg)
							.then((data) => {
								const {_id, text, ack} = data;
								message._id = _id;
								message.msg = text;
								message.ack = ack;
								if (data.ts) {
									message.ts = data.ts;
								}
								return message;
							});

					}					else {
						// Decrypt message using special first-time decryption function
						return e2eRoom.decryptInitial(message.msg)
							.then((data) => {
								const {_id, text, ack} = data;
								message._id = _id;
								message.msg = text;
								message.ack = ack;
								if (data.ts) {
									message.ts = data.ts;
								}
								return message;
							});
					}
				}
			}
		}		else {
			// Message is not encrypted.
			try {
				return Promise.resolve(message);
			} catch (err) {
				console.log(err.message);
			}
		}
	}, RocketChat.promises.priority.HIGH);
});
