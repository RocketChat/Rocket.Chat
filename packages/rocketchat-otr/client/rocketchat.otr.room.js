RocketChat.OTR.Room = class {
	constructor(userId, roomId) {
		this.userId = userId;
		this.roomId = roomId;
		this.peerId = roomId.replace(userId, '');
		this.establishing = new ReactiveVar(false);
		this.rsaReady = new ReactiveVar(false);
		this.aesReady = new ReactiveVar(false);
		this.publicKeyJWK = null;
		this.publicKey = null;
		this.privateKey = null;
		this.peerPublicKey = null;
		this.sharedSecret = null;
		this.sharedSecretJWK = null;
	}

	handshake() {
		this.establishing.set(true);
		this.rsaReady.set(false);
		this.aesReady.set(false);
		this.getPublicAndPrivateKeys(false).then(() => {
			RocketChat.Notifications.notifyUser(this.peerId, 'otr', 'handshake', { roomId: this.roomId, userId: this.userId, publicKey: this.publicKeyJWK });
		});
	}

	acknowledge() {
		this.rsaReady.set(true);
		this.getPublicAndPrivateKeys(false).then(() => {
			RocketChat.Notifications.notifyUser(this.peerId, 'otr', 'acknowledge', { roomId: this.roomId, userId: this.userId, publicKey: this.publicKeyJWK });
		});
	}

	deny() {
		this.establishing.set(false);
		this.rsaReady.set(false);
		this.aesReady.set(false);
		RocketChat.Notifications.notifyUser(this.peerId, 'otr', 'deny', { roomId: this.roomId, userId: this.userId });
	}

	end() {
		this.establishing.set(false);
		this.rsaReady.set(false);
		this.aesReady.set(false);
		RocketChat.Notifications.notifyUser(this.peerId, 'otr', 'end', { roomId: this.roomId, userId: this.userId });
	}

	sharedSecretHandshake() {
		this.establishing.set(false);
		this.aesReady.set(false);
		this.getSharedSecret().then(() => {
			this.encryptRSA(JSON.stringify(this.sharedSecretJWK), this.peerPublicKey).then((sharedSecret) => {
				RocketChat.Notifications.notifyUser(this.peerId, 'otr', 'sharedSecret-handshake', { roomId: this.roomId, userId: this.userId, sharedSecret: sharedSecret });
			})
		});
	}

	sharedSecretAcknowledge() {
		this.establishing.set(false);
		this.aesReady.set(true);
		this.encryptAES(localStorage.getItem('sharedSecret')).then((args) => {
			[sharedSecret, iv] = args;
			RocketChat.Notifications.notifyUser(this.peerId, 'otr', 'sharedSecret-acknowledge', { roomId: this.roomId, userId: this.userId, sharedSecret: sharedSecret, iv: iv });
		});
	}

	bytesToHexString(bytes) {
		if (!bytes)
			return null;
		bytes = new Uint8Array(bytes);
		var hexBytes = [];
		for (var i = 0; i < bytes.length; ++i) {
			var byteString = bytes[i].toString(16);
			if (byteString.length < 2)
				byteString = "0" + byteString;
			hexBytes.push(byteString);
		}
		return hexBytes.join("");
	}

	hexStringToUint8Array(hexString) {
		if (hexString.length % 2 != 0)
			throw "Invalid hexString";
		var arrayBuffer = new Uint8Array(hexString.length / 2);
		for (var i = 0; i < hexString.length; i += 2) {
			var byteValue = parseInt(hexString.substr(i, 2), 16);
			if (byteValue == NaN)
				throw "Invalid hexString";
			arrayBuffer[i/2] = byteValue;
		}
		return arrayBuffer;
	}

	getPublicAndPrivateKeys(refreshKeys) {
		if (!this.privateKey || !this.publicKey || refreshKeys) {
			// Generate private and public keys
			return window.crypto.subtle.generateKey({
					name: "RSA-OAEP",
					modulusLength: 2048, //can be 1024, 2048, or 4096
					publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
					hash: {name: "SHA-256"}, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
				},
				true, //whether the key is extractable (i.e. can be used in exportKey)
				["encrypt", "decrypt"] //must be ["encrypt", "decrypt"] or ["wrapKey", "unwrapKey"]
			)
			.then((key) => {
				// export private key
				this.privateKey = key.privateKey;
				this.publicKey = key.publicKey;

				// export public key
				return window.crypto.subtle.exportKey(
					"jwk", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
					key.publicKey //can be a publicKey or privateKey, as long as extractable was true
				)
				.then((publicKey) => {
					this.publicKeyJWK = publicKey;
				})
			})
			.catch((err) => {
				console.error(err);
			});
		} else {
			return Promise.resolve();
		}
	}

	importPublicKey(publicKey) {
		return window.crypto.subtle.importKey(
			"jwk", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
			publicKey,
			{   //these are the algorithm options
				name: "RSA-OAEP",
				hash: {name: "SHA-256"}, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
			},
			true, //whether the key is extractable (i.e. can be used in exportKey)
			["encrypt"] //"encrypt" or "wrapKey" for public key import or
		)
	}

	importSharedSecret(sharedSecret) {
		return window.crypto.subtle.importKey(
			"jwk", //can be "jwk" or "raw"
			sharedSecret,
			{   //this is the algorithm options
				name: "AES-CBC",
			},
			true, //whether the key is extractable (i.e. can be used in exportKey)
			["encrypt", "decrypt"] //can be "encrypt", "decrypt", "wrapKey", or "unwrapKey"
		)
	}

	encryptRSA(message, publicKey) {
		// Encrypt with peer's public key
		return window.crypto.subtle.encrypt({
				name: "RSA-OAEP",
			},
			publicKey,
			new TextEncoder("UTF-8").encode(message) //ArrayBuffer of data you want to encrypt
		)
		.then((encrypted) => {
			return this.bytesToHexString(encrypted);
		})
		.catch((err) => {
			console.log(err);
			return message;
		});
	}

	decryptRSA(message) {
		return window.crypto.subtle.decrypt({
				name: "RSA-OAEP",
			},
			this.privateKey,
			new this.hexStringToUint8Array(message) //ArrayBuffer of the data
		)
		.then((decrypted) => {
			//returns an ArrayBuffer containing the decrypted data
			return new TextDecoder("UTF-8").decode(new Uint8Array(decrypted));
		})
		.catch((err) => {
			console.log(err);
			return message;
		});
	}

	getSharedSecret() {
		return window.crypto.subtle.generateKey({
				name: "AES-CBC",
				length: 256, //can be  128, 192, or 256
			},
			true, //whether the key is extractable (i.e. can be used in exportKey)
			["encrypt", "decrypt"] //can be "encrypt", "decrypt", "wrapKey", or "unwrapKey"
		)
		.then((sharedSecret) => {
			this.sharedSecret = sharedSecret;
			// export public key
			return window.crypto.subtle.exportKey(
				"jwk", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
				sharedSecret //can be a publicKey or privateKey, as long as extractable was true
			)
			.then((sharedSecretJWK) => {
				this.sharedSecretJWK = sharedSecretJWK;
			})
		})
	}

	encryptAES(message) {
		let iv = window.crypto.getRandomValues(new Uint8Array(16));
		return window.crypto.subtle.encrypt({
				name: "AES-CBC",
				//Don't re-use initialization vectors!
				//Always generate a new iv every time your encrypt!
				iv: iv,
			},
			this.sharedSecret, //from generateKey or importKey above
			new TextEncoder("UTF-8").encode(message) //ArrayBuffer of data you want to encrypt
		)
		.then((encrypted) => {
			return [this.bytesToHexString(encrypted), this.bytesToHexString(iv)];
		})
		.catch((err) => {
			console.log(err);
			return message;
		});
	}

	decryptAES(message, iv) {
		return window.crypto.subtle.decrypt(
			{
				name: "AES-CBC",
				iv: new this.hexStringToUint8Array(iv), //The initialization vector you used to encrypt
			},
			this.sharedSecret, //from generateKey or importKey above
			new this.hexStringToUint8Array(message) //ArrayBuffer of the data
		)
		.then((decrypted) => {
			//returns an ArrayBuffer containing the decrypted data
			return new TextDecoder("UTF-8").decode(new Uint8Array(decrypted));
		})
		.catch((err) => {
			console.log(err);
			return message;
		});
	}

	onUserStream(type, data) {
		const user = Meteor.users.findOne(data.userId);
		switch(type) {
			case 'handshake':
				let timeout = null;
				this.establishing.set(true);
				this.rsaReady.set(false);
				this.aesReady.set(false);
				swal({
					title: "<i class='icon-key alert-icon'></i>" + TAPi18n.__("OTR"),
					text: TAPi18n.__("Username_wants_to_start_otr_Do_you_want_to_accept", { username: user.username }),
					html: true,
					showCancelButton: true,
					confirmButtonText: TAPi18n.__("Yes"),
					cancelButtonText: TAPi18n.__("No")
				}, (isConfirm) => {
					if (isConfirm) {
						Meteor.clearTimeout(timeout);
						this.importPublicKey(data.publicKey).then((publicKey) => {
							this.peerPublicKey = publicKey;
							FlowRouter.goToRoomById(data.roomId);
							Meteor.defer(() => {
								this.acknowledge();
							});
						});
					} else {
						Meteor.clearTimeout(timeout);
						this.deny();
					}
				});
				timeout = Meteor.setTimeout(() => {
					this.establishing.set(false);
					this.rsaReady.set(false);
					this.aesReady.set(false);
					swal.close();
				}, 10000);
				break;
			case 'acknowledge':
				this.importPublicKey(data.publicKey).then((publicKey) => {
					this.peerPublicKey = publicKey;
					this.rsaReady.set(true);
					this.sharedSecretHandshake();
				});
				break;
			case 'sharedSecret-handshake':
				this.decryptRSA(data.sharedSecret)
				.then((sharedSecret) => {
					this.sharedSecretJWK = JSON.parse(sharedSecret);
					localStorage.setItem('sharedSecret', sharedSecret);
					this.importSharedSecret(this.sharedSecretJWK)
					.then((sharedSecret) => {
						this.sharedSecret = sharedSecret;
						this.sharedSecretAcknowledge();
					})
				})
				.catch((err) => {
					this.establishing.set(false);
					this.rsaReady.set(false);
					this.aesReady.set(false);
					swal(TAPi18n.__("Error establishing encrypted connection"), null, "error");
				});
				break;
			case 'sharedSecret-acknowledge':
				this.decryptAES(data.sharedSecret, data.iv)
				.then((sharedSecret) => {
					if (sharedSecret === JSON.stringify(this.sharedSecretJWK)) {
						this.establishing.set(false);
						this.aesReady.set(true);
					} else {
						this.establishing.set(false);
						this.rsaReady.set(false);
						this.aesReady.set(false);
						swal(TAPi18n.__("Error establishing encrypted connection"), null, "error");
					}
				})
				break;
			case 'deny':
				this.establishing.set(false);
				this.rsaReady.set(false);
				this.aesReady.set(false);
				swal(TAPi18n.__("Denied"), null, "error");
				break;
			case 'end':
				this.establishing.set(false);
				this.rsaReady.set(false);
				this.aesReady.set(false);
				swal(TAPi18n.__("Ended"), null, "error");
				break;
		}
	}
}
