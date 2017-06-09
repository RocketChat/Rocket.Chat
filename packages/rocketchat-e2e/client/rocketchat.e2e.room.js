// import toastr from 'toastr';
/* globals crypto */

function ab2str(buf) {
	return RocketChat.signalUtils.toString(buf);
}

function str2ab(str) {
	return RocketChat.signalUtils.toArrayBuffer(str);
}

RocketChat.E2E.Room = class {
	constructor(userId, roomId) {
		this.userId = userId;
		this.roomId = roomId;
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

	handshake(refresh) {
		this.establishing.set(true);
		this.firstPeer = true;
		let self = this;
		Meteor.call('fetchKeychain', this.peerId, function(error, result) {
			key = JSON.parse(result);
			self.peerIdentityKey = key.lastUsedIdentityKey;
			for (let i=0; i<key.publicKeychain.length; i++) {
				if (key.publicKeychain[i][0] == self.peerIdentityKey) {
					self.peerSignedPreKey = str2ab(key.publicKeychain[i][1]);
					self.peerSignedSignature = str2ab(key.publicKeychain[i][2]);
					self.peerPreKey = str2ab(key.publicKeychain[i][3]);
					self.peerRegistrationId = key.publicKeychain[i][4];
					break;
				}
			}
			self.peerIdentityKey = str2ab(self.peerIdentityKey);
			console.log("Obtained keys: "+self.peerIdentityKey + ", "+self.peerSignedPreKey);
			self.start_session();
		});
		// RocketChat.Notifications.notifyUser(this.peerId, 'e2e', 'handshake', { roomId: this.roomId, userId: this.userId, refresh });
	}


	start_session() {
		const bAddress   = new libsignal.SignalProtocolAddress(this.peerRegistrationId, 1);
		console.log(this.peerIdentityKey);
		const sessionBuilder = new libsignal.SessionBuilder(RocketChat.E2EStorage, bAddress);

		var promise = sessionBuilder.processPreKey({
			identityKey: this.peerIdentityKey,
			registrationId : this.peerRegistrationId,
			preKey:  {
				keyId     : this.peerRegistrationId,
				publicKey : this.peerPreKey
			},
			signedPreKey: {
				keyId     : this.peerRegistrationId,
				publicKey : this.peerSignedPreKey,
				signature : this.peerSignedSignature
			}
		});

		var self = this;
		promise.then(function onsuccess() {
			console.log("Successfully created session");
			self.establishing.set(false);
			self.established.set(true);
		});

		promise.catch(function onerror(error) {
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
		Meteor.call('deleteOldOTRMessages', this.roomId);
	}

	generateKeyPair() {
		if (this.userOnlineComputation) {
			this.userOnlineComputation.stop();
		}

		this.userOnlineComputation = Tracker.autorun(() => {
			const $room = $(`#chat-window-${ this.roomId }`);
			const $title = $('.fixed-title h2', $room);
			if (this.established.get()) {
				if ($room.length && $title.length && !$('.otr-icon', $title).length) {
					$title.prepend('<i class=\'otr-icon icon-key\'></i>');
					$('.input-message-container').addClass('otr');
					$('.inner-right-toolbar').prepend('<i class=\'otr-icon icon-key\'></i>');
				}
			} else if ($title.length) {
				$('.otr-icon', $title).remove();
				$('.input-message-container').removeClass('otr');
				$('.inner-right-toolbar .otr-icon').remove();
			}
		});

		// Generate an ephemeral key pair.
		return RocketChat.E2E.crypto.generateKey({
			name: 'ECDH',
			namedCurve: 'P-256'
		}, false, ['deriveKey', 'deriveBits'])
			.then((keyPair) => {
				this.keyPair = keyPair;
				return RocketChat.E2E.crypto.exportKey('jwk', keyPair.publicKey);
			})
			.then((exportedPublicKey) => {
				this.exportedPublicKey = exportedPublicKey;

				// Once we have generated new keys, it's safe to delete old messages
				Meteor.call('deleteOldOTRMessages', this.roomId);
			})
			.catch((e) => {
				console.log(e);
			});
	}

	importPublicKey(publicKey) {
		return RocketChat.E2E.crypto.importKey('jwk', EJSON.parse(publicKey), {
			name: 'ECDH',
			namedCurve: 'P-256'
		}, false, []).then((peerPublicKey) => {
			return RocketChat.E2E.crypto.deriveBits({
				name: 'ECDH',
				namedCurve: 'P-256',
				public: peerPublicKey
			}, this.keyPair.privateKey, 256);
		}).then((bits) => {
			return RocketChat.E2E.crypto.digest({
				name: 'SHA-256'
			}, bits);
		}).then((hashedBits) => {
			// We truncate the hash to 128 bits.
			const sessionKeyData = new Uint8Array(hashedBits).slice(0, 16);
			return RocketChat.E2E.crypto.importKey('raw', sessionKeyData, {
				name: 'AES-GCM'
			}, false, ['encrypt', 'decrypt']);
		}).then((sessionKey) => {
			// Session key available.
			this.sessionKey = sessionKey;
		});
	}

	encryptText(data) {
		if (!_.isObject(data)) {
			data = new TextEncoder('UTF-8').encode(EJSON.stringify({ text: data, ack: Random.id((Random.fraction()+1)*20) }));
		}
		const iv = crypto.getRandomValues(new Uint8Array(12));

		return RocketChat.E2E.crypto.encrypt({
			name: 'AES-GCM',
			iv
		}, this.sessionKey, data).then((cipherText) => {
			cipherText = new Uint8Array(cipherText);
			const output = new Uint8Array(iv.length + cipherText.length);
			output.set(iv, 0);
			output.set(cipherText, iv.length);
			return EJSON.stringify(output);
		}).catch(() => {
			throw new Meteor.Error('encryption-error', 'Encryption error.');
		});
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
		let cipherText = EJSON.parse(message);
		const iv = cipherText.slice(0, 12);
		cipherText = cipherText.slice(12);

		return RocketChat.E2E.crypto.decrypt({
			name: 'AES-GCM',
			iv
		}, this.sessionKey, cipherText)
			.then((data) => {
				data = EJSON.parse(new TextDecoder('UTF-8').decode(new Uint8Array(data)));
				return data;
			})
			.catch((e) => {
				// toastr.error(e);
				console.log(e);
				return message;
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
							if (key.publicKeychain[i][0] == this.peerIdentityKey) {
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
