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

	// E2E's public-private keypairs
	crypto.subtle.importKey('jwk', JSON.parse(localStorage.getItem('RSA-PrivKey')), {name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: {name: 'SHA-256'}}, true, ['decrypt']).then(function(key) {
		RocketChat.E2EStorage.put('RSA-PrivKey', key);
	});

	crypto.subtle.importKey('jwk', JSON.parse(localStorage.getItem('RSA-PubKey')), {name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: {name: 'SHA-256'}}, true, ['encrypt']).then(function(key) {
		RocketChat.E2EStorage.put('RSA-PubKey', key);
	});

	// Store public keys in server
	Meteor.call('addKeyToChain', {
		'RSA-PubKey': localStorage.getItem('RSA-PubKey')
	});
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
		  // Meteor.call("emptyKeychain");
		  // RocketChat.E2EStorage.store = {}
		  // localStorage.clear();

		// This is a new device for signal encryption
		var userpass = window.prompt("Enter E2E Password");
		console.log(userpass);

        var iterations = 1000;
        var hash = "SHA-256";

        // First, create a PBKDF2 "key" containing the password
        window.crypto.subtle.importKey(
            "raw",
            str2ab(userpass),
            {"name": "PBKDF2"},
            false,
            ["deriveKey"]).
        // Derive a key from the password
        then(function(baseKey){
            return window.crypto.subtle.deriveKey(
                {
                    "name": "PBKDF2",
                    "salt": str2ab(Meteor.userId()),
                    "iterations": iterations,
                    "hash": hash
                },
                baseKey,
                {"name": "AES-CBC", "length": 256}, // Key we want
                true,                               // Extractable
                ["encrypt", "decrypt"]              // For new key
                );
        }).
        // Export it so we can display it
        then(function(masterKey) {
        	RocketChat.E2EStorage.put('E2E-MasterKey', masterKey);
			window.crypto.subtle.exportKey("jwk", masterKey).then(function(result) {
				localStorage.setItem('E2E-MasterKey', JSON.stringify(result));
				console.log(JSON.stringify(result));
			});




			const RSAKeys = new Promise((resolve) => {
				Meteor.call('fetchMyKeys', function(error, result) {
					if (result !== null && result !== undefined && EJSON.parse(result)["RSA-EPrivKey"]!="") {
						console.log("Key found");
						console.log(EJSON.parse(result));
						var pubkey = EJSON.parse(result)["RSA-PubKey"];
						var eprivkey = EJSON.parse(result)["RSA-EPrivKey"];
						crypto.subtle.importKey('jwk', EJSON.parse(pubkey), {name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: {name: 'SHA-256'}}, true, ['encrypt']).then(function(public_key) {
							localStorage.setItem('RSA-PubKey', pubkey);
							RocketChat.E2EStorage.put('RSA-PubKey', public_key);

							let cipherText = EJSON.parse(eprivkey);
							const vector = cipherText.slice(0, 16);
							cipherText = cipherText.slice(16);
							crypto.subtle.decrypt({name: 'AES-CBC', iv: vector}, masterKey, cipherText).then((result) => {
								console.log("Decrypted private key.");
								console.log(ab2str(result));
								localStorage.setItem('RSA-PrivKey', ab2str(result));
								crypto.subtle.importKey('jwk', EJSON.parse(ab2str(result)), {name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: {name: 'SHA-256'}}, true, ['decrypt']).then(function(private_key) {
									RocketChat.E2EStorage.put('RSA-PrivKey', private_key);
									resolve(true);
								});
								//EJSON.parse(ab2str(result));
							})
						});
					}					
					else {
						// Could not obtain public-private keypair from server.
						resolve(false);
					}
				});

			}).then(function(val) {
				if (val === false) {
					console.log("generate new key");
					promise_key = crypto.subtle.generateKey({name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: {name: 'SHA-256'}}, true, ['encrypt', 'decrypt']);
					promise_key.then(function(key) {
						crypto.subtle.exportKey('jwk', key.publicKey).then(function(result) {
							localStorage.setItem('RSA-PubKey', JSON.stringify(result));

							crypto.subtle.exportKey('jwk', key.privateKey).then(function(result) {
								localStorage.setItem('RSA-PrivKey', JSON.stringify(result));
								const vector = crypto.getRandomValues(new Uint8Array(16));
								crypto.subtle.encrypt({name: 'AES-CBC', iv: vector}, masterKey, str2ab(localStorage.getItem('RSA-PrivKey'))).then((result) => {
									cipherText = new Uint8Array(result);
									const output = new Uint8Array(vector.length + cipherText.length);
									output.set(vector, 0);
									output.set(cipherText, vector.length);
									console.log(EJSON.stringify(output));
									Meteor.call('addKeyToChain', {
										'RSA-PubKey': localStorage.getItem('RSA-PubKey'),
										'RSA-EPrivKey': EJSON.stringify(output)
									});;
								});
							});	
						});

						RocketChat.E2EStorage.put('RSA-PrivKey', key.privateKey);
						RocketChat.E2EStorage.put('RSA-PubKey', key.publicKey);
					});
				}
			});

		});
		this.ready.set(true);

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
