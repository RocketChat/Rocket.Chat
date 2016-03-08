RocketChat.OTR = new (class {
	constructor() {
		this.enabled = !!(window.crypto && window.crypto.subtle) && RocketChat.settings.get('OTR_Enable');
		this.instancesByRoomId = {};
	}

	getInstanceByRoomId(roomId) {
		var enabled, subscription;
		subscription = ChatSubscription.findOne({
			rid: roomId
		});
		if (!subscription) {
			return;
		}
		enabled = false;
		switch (subscription.t) {
			case 'd':
				enabled = RocketChat.settings.get('OTR_Enabled');
				break;
		}
		if (enabled === false) {
			return;
		}
		if (this.instancesByRoomId[roomId] == null) {
			this.instancesByRoomId[roomId] = new RocketChat.OTR.Room(Meteor.userId(), roomId);
		}
		return this.instancesByRoomId[roomId];
	}
})();

Meteor.startup(function() {
	RocketChat.Notifications.onUser('otr', (type, data) => {
		if (!data.roomId || data.userId === Meteor.userId()) {
			return;
		} else {
			RocketChat.OTR.getInstanceByRoomId(data.roomId).onUserStream(type, data);
		}
	});
	RocketChat.callbacks.add('onClientBeforeSendMessage', function(message) {
		if (message.rid && RocketChat.OTR.instancesByRoomId && RocketChat.OTR.instancesByRoomId[message.rid] && RocketChat.OTR.instancesByRoomId[message.rid].established.get()) {
			return RocketChat.OTR.instancesByRoomId[message.rid].encrypt(message);
		} else {
			return message;
		}
	}, RocketChat.callbacks.priority.HIGH);
	RocketChat.callbacks.add('renderMessage', function(message) {
		if (message.rid && RocketChat.OTR.instancesByRoomId && RocketChat.OTR.instancesByRoomId[message.rid] && RocketChat.OTR.instancesByRoomId[message.rid].established.get()) {
			return RocketChat.OTR.instancesByRoomId[message.rid].decrypt(message);
		} else {
			return message;
		}
	}, RocketChat.callbacks.priority.HIGH);
});

// RocketChat.OTR = class { enabled: false };

// Meteor.startup(function() {
// 	if (window.crypto.subtle) {
// 		RocketChat.OTR.enabled = true;
// 		RocketChat.OTR.rooms = {};

// 		RocketChat.OTR.convertStringToArrayBufferView = function(str) {
// 			var bytes = new Uint8Array(str.length);
// 			for (var iii = 0; iii < str.length; iii++) {
// 				bytes[iii] = str.charCodeAt(iii);
// 			}
// 			return bytes;
// 		}

// 		RocketChat.OTR.convertArrayBufferViewtoString = function(buffer) {
// 			var str = "";
// 			for (var iii = 0; iii < buffer.byteLength; iii++) {
// 				str += String.fromCharCode(buffer[iii]);
// 			}
// 			return str;
// 		}

// 		RocketChat.OTR.generateKeys = function() {
// 			// Generate private and public keys
// 			window.crypto.subtle.generateKey({
// 					name: "RSA-OAEP",
// 					modulusLength: 2048, //can be 1024, 2048, or 4096
// 					publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
// 					hash: {name: "SHA-256"}, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
// 				},
// 				true, //whether the key is extractable (i.e. can be used in exportKey)
// 				["encrypt", "decrypt"] //must be ["encrypt", "decrypt"] or ["wrapKey", "unwrapKey"]
// 			).then(function(key) {
// 				// export private key
// 				window.crypto.subtle.exportKey(
// 					"jwk", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
// 					key.privateKey //can be a publicKey or privateKey, as long as extractable was true
// 				)
// 				.then(function(privateKey) {
// 					localStorage.setItem('privateKey', JSON.stringify(privateKey));
// 				})
// 				.catch(function(err){
// 					console.error(err);
// 				});

// 				// export public key
// 				window.crypto.subtle.exportKey(
// 					"jwk", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
// 					key.publicKey //can be a publicKey or privateKey, as long as extractable was true
// 				)
// 				.then(function(publicKey) {
// 					localStorage.setItem('publicKey', JSON.stringify(publicKey));
// 				})
// 				.catch(function(err){
// 					console.error(err);
// 				});
// 			});
// 		}

// 		RocketChat.OTR.importPeerPublicKey = function(peerPublicKey, callback) {
// 			window.crypto.subtle.importKey(
// 				"jwk", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
// 				peerPublicKey,
// 				{   //these are the algorithm options
// 					name: "RSA-OAEP",
// 					hash: {name: "SHA-256"}, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
// 				},
// 				false, //whether the key is extractable (i.e. can be used in exportKey)
// 				["encrypt"] //"encrypt" or "wrapKey" for public key import or
// 			)
// 			.then(function(publicKey){
// 				callback(publicKey);
// 			})
// 			.catch(function(err){
// 				console.error(err);
// 			});
// 		}

// 		RocketChat.OTR.encrypt = function(message, peerPublicKey) {
// 			this.importPeerPublicKey(peerPublicKey, (publicKey) => {
// 				window.crypto.subtle.encrypt({
// 						name: "RSA-OAEP",
// 					},
// 					publicKey, //from generateKey or importKey above
// 					this.convertStringToArrayBufferView(message) //ArrayBuffer of data you want to encrypt
// 				)
// 				.then((encrypted) => {
// 					console.log(btoa(this.convertArrayBufferViewtoString(new Uint8Array(encrypted))));
// 				})
// 				.catch(function(err){
// 					console.error(err);
// 				});
// 			})
// 		}

// 		RocketChat.OTR.importPrivateKey = function(callback) {
// 			window.crypto.subtle.importKey(
// 				"jwk", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
// 				JSON.parse(localStorage.getItem('privateKey')),
// 				{   //these are the algorithm options
// 					name: "RSA-OAEP",
// 					hash: {name: "SHA-256"}, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
// 				},
// 				false, //whether the key is extractable (i.e. can be used in exportKey)
// 				["decrypt"] //"decrypt" or "unwrapKey" for private key imports
// 			)
// 			.then(function(privateKey){
// 				callback(privateKey);
// 			})
// 			.catch(function(err){
// 				console.error(err);
// 			});
// 		}

// 		RocketChat.OTR.decrypt = function(message) {
// 			message = atob(message);
// 			this.importPrivateKey((privateKey) => {
// 				window.crypto.subtle.decrypt({
// 						name: "RSA-OAEP",
// 					},
// 					privateKey, //from generateKey or importKey above
// 					this.convertStringToArrayBufferView(message) //ArrayBuffer of the data
// 				)
// 				.then((decrypted) => {
// 					//returns an ArrayBuffer containing the decrypted data
// 					console.log(this.convertArrayBufferViewtoString(new Uint8Array(decrypted)));
// 				})
// 				.catch(function(err){
// 					console.error(err);
// 				});
// 			});
// 		}
// 	}
// });