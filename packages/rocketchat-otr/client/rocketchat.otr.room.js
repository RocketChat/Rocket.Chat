/* globals crypto */

RocketChat.OTR.Room = class {
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
	}

	handshake(refresh) {
		this.establishing.set(true);
		this.firstPeer = true;
		this.generateKeyPair().then(() => {
			RocketChat.Notifications.notifyUser(this.peerId, 'otr', 'handshake', { roomId: this.roomId, userId: this.userId, publicKey: EJSON.stringify(this.exportedPublicKey), refresh: refresh });
		});
	}

	acknowledge() {
		RocketChat.Notifications.notifyUser(this.peerId, 'otr', 'acknowledge', { roomId: this.roomId, userId: this.userId, publicKey: EJSON.stringify(this.exportedPublicKey) });
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
		Meteor.call('deleteOldOTRMessages', this.roomId);
	}

	generateKeyPair() {
		if (this.userOnlineComputation) {
			this.userOnlineComputation.stop();
		}

		this.userOnlineComputation = Tracker.autorun(() => {
			var $room = $('#chat-window-' + this.roomId);
			var $title = $('.fixed-title h2', $room);
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
		return RocketChat.OTR.crypto.generateKey({
			name: 'ECDH',
			namedCurve: 'P-256'
		}, false, ['deriveKey', 'deriveBits']).then((keyPair) => {
			this.keyPair = keyPair;
			return RocketChat.OTR.crypto.exportKey('jwk', keyPair.publicKey);
		})
		.then((exportedPublicKey) => {
			this.exportedPublicKey = exportedPublicKey;

			// Once we have generated new keys, it's safe to delete old messages
			Meteor.call('deleteOldOTRMessages', this.roomId);
		})
		.catch((e) => {
			toastr.error(e);
		});
	}

	importPublicKey(publicKey) {
		return RocketChat.OTR.crypto.importKey('jwk', EJSON.parse(publicKey), {
			name: 'ECDH',
			namedCurve: 'P-256'
		}, false, []).then((peerPublicKey) => {
			return RocketChat.OTR.crypto.deriveBits({
				name: 'ECDH',
				namedCurve: 'P-256',
				public: peerPublicKey
			}, this.keyPair.privateKey, 256);
		}).then((bits) => {
			return RocketChat.OTR.crypto.digest({
				name: 'SHA-256'
			}, bits);
		}).then((hashedBits) => {
			// We truncate the hash to 128 bits.
			var sessionKeyData = new Uint8Array(hashedBits).slice(0, 16);
			return RocketChat.OTR.crypto.importKey('raw', sessionKeyData, {
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
		var iv = crypto.getRandomValues(new Uint8Array(12));

		return RocketChat.OTR.crypto.encrypt({
			name: 'AES-GCM',
			iv: iv
		}, this.sessionKey, data).then((cipherText) => {
			cipherText = new Uint8Array(cipherText);
			var output = new Uint8Array(iv.length + cipherText.length);
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

		var data = new TextEncoder('UTF-8').encode(EJSON.stringify({
			_id: message._id,
			text: message.msg,
			userId: this.userId,
			ack: Random.id((Random.fraction()+1)*20),
			ts: ts
		}));
		var enc = this.encryptText(data);
		return enc;
	}

	decrypt(message) {
		var cipherText = EJSON.parse(message);
		var iv = cipherText.slice(0, 12);
		cipherText = cipherText.slice(12);

		return RocketChat.OTR.crypto.decrypt({
			name: 'AES-GCM',
			iv: iv
		}, this.sessionKey, cipherText).then((data) => {
			data = EJSON.parse(new TextDecoder('UTF-8').decode(new Uint8Array(data)));
			return data;
		})
		.catch((e) => {
			toastr.error(e);
			return message;
		});
	}

	onUserStream(type, data) {
		const user = Meteor.users.findOne(data.userId);
		switch (type) {
			case 'handshake':
				let timeout = null;

				let establishConnection = () => {
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
				};

				if (data.refresh && this.established.get()) {
					this.reset();
					establishConnection();
				} else {
					if (this.established.get()) {
						this.reset();
					}

					swal({
						title: '<i class=\'icon-key alert-icon\'></i>' + TAPi18n.__('OTR'),
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
				this.importPublicKey(data.publicKey).then(() => {
					this.established.set(true);
				});
				break;

			case 'deny':
				if (this.establishing.get()) {
					this.reset();
					const user = Meteor.users.findOne(this.peerId);
					swal({
						title: '<i class=\'icon-key alert-icon\'></i>' + TAPi18n.__('OTR'),
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
						title: '<i class=\'icon-key alert-icon\'></i>' + TAPi18n.__('OTR'),
						text: TAPi18n.__('Username_ended_the_OTR_session', { username: user.username }),
						html: true
					});
				}
				break;
		}
	}
};
