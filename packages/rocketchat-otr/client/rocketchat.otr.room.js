RocketChat.OTR.Room = class {
	constructor(userId, roomId) {
		this.userId = userId;
		this.roomId = roomId;
		this.peerId = roomId.replace(userId, '');
		this.established = new ReactiveVar(false);
		this.establishing = new ReactiveVar(false);

		this.keyPair = null;
		this.exportedPublicKey = null;
		this.sessionKey = null;

		this.serial = 0;
		this.peerSerial = 0;
	}

	handshake(refresh) {
		this.establishing.set(true);
		this.firstPeer = true;
		this.generateKeyPair().then(() => {
			RocketChat.Notifications.notifyUser(this.peerId, 'otr', 'handshake', { roomId: this.roomId, userId: this.userId, publicKey: this.bytesToHexString(this.exportedPublicKey), refresh: refresh });
		});
	}

	acknowledge() {
		RocketChat.Notifications.notifyUser(this.peerId, 'otr', 'acknowledge', { roomId: this.roomId, userId: this.userId, publicKey: this.bytesToHexString(this.exportedPublicKey) });
	}

	deny() {
		this.reset();
		RocketChat.Notifications.notifyUser(this.peerId, 'otr', 'deny', { roomId: this.roomId, userId: this.userId });
	}

	end() {
		this.reset();
		RocketChat.Notifications.notifyUser(this.peerId, 'otr', 'end', { roomId: this.roomId, userId: this.userId });
	}

	reset() {
		this.establishing.set(false);
		this.established.set(false);
		this.keyPair = null;
		this.exportedPublicKey = null;
		this.sessionKey = null;
		this.serial = null;
		this.peerSerial = null;
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

	generateKeyPair() {
		// Generate an ephemeral key pair.
		return window.crypto.subtle.generateKey({
			name: 'ECDH',
			namedCurve: 'P-256'
		}, false, ['deriveKey', 'deriveBits']).then((keyPair) => {
			this.keyPair = keyPair;
			return crypto.subtle.exportKey('spki', keyPair.publicKey);
		})
		.then((exportedPublicKey) => {
			this.exportedPublicKey = exportedPublicKey;
		})
		.catch((err) => {
			console.error(err);
		});
	}

	importPublicKey(publicKey) {
		return window.crypto.subtle.importKey('spki', this.hexStringToUint8Array(publicKey), {
			name: 'ECDH',
			namedCurve: 'P-256'
		}, false, []).then((peerPublicKey) => {
			return crypto.subtle.deriveBits({
				name: 'ECDH',
				namedCurve: 'P-256',
				public: peerPublicKey
			}, this.keyPair.privateKey, 256);
		}).then((bits) => {
			return crypto.subtle.digest({
				name: 'SHA-256'
			}, bits);
		}).then((hashedBits) => {
			// We truncate the hash to 128 bits.
			var sessionKeyData = new Uint8Array(hashedBits).slice(0, 16);
			return crypto.subtle.importKey('raw', sessionKeyData, {
				name: 'AES-GCM'
			}, false, ['encrypt', 'decrypt']);
		}).then((sessionKey) => {
			// Session key available.
			this.sessionKey = sessionKey;
		});
	}

	encrypt(message) {
		this.serial++;
		var data = new TextEncoder("UTF-8").encode(EJSON.stringify({serial: this.serial, msg: message, userId: this.userId, padding: Random.id(Random.fraction()*20) }))
		var iv = crypto.getRandomValues(new Uint8Array(12));

		return crypto.subtle.encrypt({
			name: 'AES-GCM',
			iv: iv
		}, this.sessionKey, data).then((cipherText) => {
			cipherText = new Uint8Array(cipherText);
			var output = new Uint8Array(iv.length + cipherText.length);
			output.set(iv, 0);
			output.set(cipherText, iv.length);
			return this.bytesToHexString(output);
		}).catch((e) => {
			return "";
		});
	}

	decrypt(message) {
		var cipherText = new this.hexStringToUint8Array(message);
		var iv = cipherText.slice(0, 12);
		cipherText = cipherText.slice(12);

		return crypto.subtle.decrypt({
			name: 'AES-GCM',
			iv: iv
		}, this.sessionKey, cipherText).then((data) => {
			data = EJSON.parse(new TextDecoder("UTF-8").decode(new Uint8Array(data)));

			// This prevents any replay attacks. Or attacks where messages are changed in order.
			// If message is from the same userId as me, serials must be equal
			if (data.userId === this.userId && data.serial !== this.serial) {
				throw new Error("Invalid serial.");
			} else if (data.userId !== this.userId) {
				// If serial difference is larger than one, message is out of order
				var checkSerial = data.serial - this.peerSerial;
				if (checkSerial !== 1) {
					throw new Error("Invalid serial.");
				}

				// update serial number to the last received serial
				this.peerSerial = data.serial;
			}

			return data.msg;
		})
		.catch((e) => {
			return message;
		});
	}

	onUserStream(type, data) {
		const user = Meteor.users.findOne(data.userId);
		switch(type) {
			case 'handshake':
				let timeout = null;

				establishConnection = () => {
					this.establishing.set(true);
					Meteor.clearTimeout(timeout);
					this.generateKeyPair().then(() => {
						this.importPublicKey(data.publicKey).then(() => {
							this.firstPeer = false;
							FlowRouter.goToRoomById(data.roomId);
							Meteor.defer(() => {
								this.established.set(true);
								this.acknowledge();
							});
						});
					});
				}

				if (data.refresh && this.established.get()) {
					this.reset();
					establishConnection();
				} else {
					if (this.established.get()) {
						this.reset();
					}

					swal({
						title: "<i class='icon-key alert-icon'></i>" + TAPi18n.__("OTR"),
						text: TAPi18n.__("Username_wants_to_start_otr_Do_you_want_to_accept", { username: user.username }),
						html: true,
						showCancelButton: true,
						confirmButtonText: TAPi18n.__("Yes"),
						cancelButtonText: TAPi18n.__("No")
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
				this.importPublicKey(data.publicKey).then(() => {
					this.established.set(true);
				});
				break;

			case 'deny':
				if (this.establishing.get()) {
					this.reset();
					swal(TAPi18n.__("Denied"), null, "error");
				}
				break;

			case 'end':
				if (this.established.get()) {
					this.reset();
					swal(TAPi18n.__("Ended"), null, "error");
				}
				break;
		}
	}
}
