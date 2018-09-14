/* eslint-disable no-undef */

import { call } from 'meteor/rocketchat:lib';

function ab2str(buf) {
	return RocketChat.signalUtils.toString(buf);
}

function str2ab(str) {
	return RocketChat.signalUtils.toArrayBuffer(str);
}

class E2E {
	constructor() {
		this.enabled = new ReactiveVar(false);
		this.instancesByRoomId = {};
		this.ready = new ReactiveVar(false);
	}

	isEnabled() {
		return this.enabled.get();
	}

	isReady() {
		return this.ready.get();
	}

	getInstanceByRoomId(roomId) {
		if (!this.enabled.get()) {
			return;
		}

		if (this.instancesByRoomId[roomId]) {
			return this.instancesByRoomId[roomId];
		}

		const subscription = RocketChat.models.Subscriptions.findOne({
			rid: roomId,
		});

		if (!subscription || (subscription.t !== 'd' && subscription.t !== 'p')) {
			return;
		}

		this.instancesByRoomId[roomId] = new RocketChat.E2E.Room(Meteor.userId(), roomId, subscription.t);
		return this.instancesByRoomId[roomId];
	}

	async startClient() {
		// To reset all keys (local and on server):
		// await call("emptyKeychain");
		// RocketChat.E2EStorage.store = {}
		// localStorage.clear();

		// This is a new device for signal encryption
		const userPassword = window.prompt('Enter E2E Password');

		if (userPassword !== null) {
			const iterations = 1000;
			const hash = 'SHA-256';

			// First, create a PBKDF2 "key" containing the password
			let baseKey;
			try {
				baseKey = await window.crypto.subtle.importKey('raw', str2ab(userPassword), { name: 'PBKDF2' }, false, ['deriveKey']);
			} catch (error) {
				console.log('E2E -> Error creating a key based on user password: ', error);
				return;
			}

			// Derive a key from the password
			let masterKey;
			try {
				masterKey = await window.crypto.subtle.deriveKey({ name: 'PBKDF2', salt: str2ab(Meteor.userId()), iterations, hash }, baseKey, { name: 'AES-CBC', length: 256 }, true, ['encrypt', 'decrypt']);
			} catch (error) {
				console.log('E2E -> Error deriving baseKey: ', error);
				return;
			}

			// Export it so we can display it
			RocketChat.E2EStorage.put('E2E-MasterKey', masterKey);
			let exportKey;
			try {
				exportKey = await window.crypto.subtle.exportKey('jwk', masterKey);
			} catch (error) {
				console.log('E2E -> Error exporting key: ', error);
				return;
			}
			localStorage.setItem('E2E-MasterKey', JSON.stringify(exportKey));
			let rsaKeys;
			try {
				rsaKeys = await call('fetchMyKeys');
			} catch (error) {
				console.log('E2E -> Error fetching RSA keys: ', error);
				return;
			}
			if (rsaKeys && EJSON.parse(rsaKeys)['RSA-EPrivKey']) {
				const pubkey = EJSON.parse(rsaKeys)['RSA-PubKey'];
				const eprivkey = EJSON.parse(rsaKeys)['RSA-EPrivKey'];
				let publicKey;
				try {
					publicKey = await crypto.subtle.importKey('jwk', EJSON.parse(pubkey), { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: { name: 'SHA-256' } }, true, ['encrypt']);
				} catch (error) {
					console.log('E2E -> Error importing public key: ', error);
					return;
				}

				localStorage.setItem('RSA-PubKey', pubkey);
				RocketChat.E2EStorage.put('RSA-PubKey', publicKey);

				let cipherText = EJSON.parse(eprivkey);
				const vector = cipherText.slice(0, 16);
				cipherText = cipherText.slice(16);

				let privKey;
				try {
					privKey = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: vector }, masterKey, cipherText);
				} catch (error) {
					console.log('E2E -> Error decrypting private key: ', error);
					return;
				}
				localStorage.setItem('RSA-PrivKey', ab2str(privKey));
				let privateKey;
				try {
					privateKey = await crypto.subtle.importKey('jwk', EJSON.parse(ab2str(privKey)), { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: { name: 'SHA-256' } }, true, ['decrypt']);
				} catch (error) {
					console.log('E2E -> Error importing private key: ', error);
					return;
				}

				RocketChat.E2EStorage.put('RSA-PrivKey', privateKey);
			} else {
				// Could not obtain public-private keypair from server.
				let key;
				try {
					key = await crypto.subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: { name: 'SHA-256' } }, true, ['encrypt', 'decrypt']);
				} catch (error) {
					console.log('E2E -> Error generating key: ', error);
					return;
				}

				let publicKey;
				try {
					publicKey = await crypto.subtle.exportKey('jwk', key.publicKey);
				} catch (error) {
					console.log('E2E -> Error exporting public key: ', error);
					return;
				}
				localStorage.setItem('RSA-PubKey', JSON.stringify(publicKey));

				let privateKey;
				try {
					privateKey = await crypto.subtle.exportKey('jwk', key.privateKey);
				} catch (error) {
					console.log('E2E -> Error exporting private key: ', error);
					return;
				}

				localStorage.setItem('RSA-PrivKey', JSON.stringify(privateKey));
				const vector = crypto.getRandomValues(new Uint8Array(16));
				let rsaKeys;
				try {
					rsaKeys = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: vector }, masterKey, str2ab(localStorage.getItem('RSA-PrivKey')));
				} catch (error) {
					console.log('E2E -> Error encrypting rsaKeys: ', error);
					return;
				}

				cipherText = new Uint8Array(rsaKeys);
				const output = new Uint8Array(vector.length + cipherText.length);
				output.set(vector, 0);
				output.set(cipherText, vector.length);
				await call('addKeyToChain', {
					'RSA-PubKey': localStorage.getItem('RSA-PubKey'),
					'RSA-EPrivKey': EJSON.stringify(output),
				});

				RocketChat.E2EStorage.put('RSA-PrivKey', key.privateKey);
				RocketChat.E2EStorage.put('RSA-PubKey', key.publicKey);
			}

			this.ready.set(true);
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
	RocketChat.promises.add('onClientMessageReceived', async function(message) {
		if (message.rid && RocketChat.E2E.getInstanceByRoomId(message.rid) && message.t === 'e2e' && !message.file) {
			const e2eRoom = RocketChat.E2E.getInstanceByRoomId(message.rid);
			if (e2eRoom.typeOfRoom === 'p' || e2eRoom.typeOfRoom === 'd') {
				if (!RocketChat.E2E.isReady()) {
					RocketChat.E2E.startClient();
				}
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

				} else {
					// User does not have session key. Need to download and decrypt from subscription model.
					let groupKey;
					try {
						groupKey = await call('fetchGroupE2EKey', e2eRoom.roomId);
					} catch (error) {
						console.log('E2E -> Error fetching group key: ', error);
						return;
					}
					let cipherText = EJSON.parse(groupKey);
					const vector = cipherText.slice(0, 16);
					cipherText = cipherText.slice(16);

					// Decrypt downloaded session key
					let sessionKey;
					try {
						sessionKey = await crypto.subtle.decrypt({ name: 'RSA-OAEP', iv: vector }, RocketChat.E2EStorage.get('RSA-PrivKey'), cipherText);
					} catch (error) {
						console.log('E2E -> Error decrypting sessionKey: ', error);
						return;
					}

					e2eRoom.exportedSessionKey = ab2str(sessionKey);

					// Import key to make it ready for use
					let key;
					try {
						key = await crypto.subtle.importKey('jwk', EJSON.parse(e2eRoom.exportedSessionKey), { name: 'AES-CBC', iv: vector }, true, ['encrypt', 'decrypt']);
					} catch (error) {
						console.log('E2E -> Error importing key: ', error);
						return;
					}

					e2eRoom.groupSessionKey = key;
					e2eRoom.established.set(true);
					e2eRoom.establishing.set(false);

					// Session has been established. Decrypt received message.
					let data;
					try {
						data = await e2eRoom.decrypt(message.msg);
					} catch (error) {
						console.log('E2E -> Error decrypting message: ', error);
						return;
					}
					message._id = data._id;
					message.msg = data.text;
					message.ack = data.ack;
					if (data.ts) {
						message.ts = data.ts;
					}
					return message;
				}
			}
		} else {
			return message;
		}
	}, RocketChat.promises.priority.HIGH);
});
