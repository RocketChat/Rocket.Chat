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

		if (!subscription || subscription.t !== 'd') {
			return;
		}

		this.instancesByRoomId[roomId] = new RocketChat.E2E.Room(Meteor.userId(), roomId);
		return this.instancesByRoomId[roomId];
	}

	registerClient() {
		var KeyHelper = libsignal.KeyHelper;
		var registrationId = KeyHelper.generateRegistrationId();
		// this.store = RocketChat.signalStore;
		localStorage.setItem("registrationId", registrationId);
		KeyHelper.generateIdentityKeyPair().then(function(identityKeyPair) {
		  console.log(identityKeyPair.pubKey);
		  console.log(JSON.stringify(identityKeyPair));
		  console.log(JSON.parse(JSON.stringify(identityKeyPair)));
	      localStorage.setItem("identityKey", identityKeyPair);
	      // write_console(client + " - Generated Identity Key Pair: ",util.toString(identityKeyPair.pubKey));
	      console.log(RocketChat.signalUtils.toString(identityKeyPair.pubKey));
	      KeyHelper.generatePreKey(localStorage.getItem("registrationId")).then(function(preKey) {
	          localStorage.setItem("prekey"+preKey.keyId, preKey.keyPair);
	          // write_console(client + " - Generated Pre Key Pair: ",util.toString(preKey.keyPair.pubKey));
	          console.log(RocketChat.signalUtils.toString(preKey.keyPair.pubKey));
	      });

	      KeyHelper.generateSignedPreKey(this.store.get("identityKey"), localStorage.getItem("registrationId")).then(function(signedPreKey) {
	          localStorage.setItem("signedprekey"+signedPreKey.keyId, signedPreKey.keyPair);
	          localStorage.setItem("signedPreKeySignature"+localStorage.getItem("registrationId"), signedPreKey.signature)
	          // write_console(client + " - Generated Signed Pre Key Pair: ",util.toString(signedPreKey.keyPair.pubKey));
	          // keys_status[client] = 1;
	          // if (keys_status["A"] == 1 && keys_status["B"] == 1) {
	          //   start_session();
	          // }
	          console.log(RocketChat.signalUtils.toString(signedPreKey.keyPair.pubKey));
	      });
  });
	}
}

RocketChat.E2E = new E2E();

Meteor.startup(function() {
	Tracker.autorun(function() {
		if (Meteor.userId()) {
			RocketChat.Notifications.onUser('otr', (type, data) => {
				if (!data.roomId || !data.userId || data.userId === Meteor.userId()) {
					return;
				} else {
					RocketChat.E2E.getInstanceByRoomId(data.roomId).onUserStream(type, data);
				}
			});
		}
	});

	RocketChat.promises.add('onClientBeforeSendMessage', function(message) {
		if (message.rid && RocketChat.E2E.getInstanceByRoomId(message.rid) && RocketChat.E2E.getInstanceByRoomId(message.rid).established.get()) {
			return RocketChat.E2E.getInstanceByRoomId(message.rid).encrypt(message)
				.then((msg) => {
					message.msg = msg;
					message.t = 'otr';
					return message;
				});
		} else {
			return Promise.resolve(message);
		}
	}, RocketChat.promises.priority.HIGH);

	RocketChat.promises.add('onClientMessageReceived', function(message) {
		if (message.rid && RocketChat.E2E.getInstanceByRoomId(message.rid) && RocketChat.E2E.getInstanceByRoomId(message.rid).established.get()) {
			if (message.notification) {
				message.msg = t('Encrypted_message');
				return Promise.resolve(message);
			} else {
				const otrRoom = RocketChat.E2E.getInstanceByRoomId(message.rid);
				return otrRoom.decrypt(message.msg)
					.then((data) => {
						const {_id, text, ack} = data;
						message._id = _id;
						message.msg = text;

						if (data.ts) {
							message.ts = data.ts;
						}

						if (message.otrAck) {
							return otrRoom.decrypt(message.otrAck)
								.then((data) => {
									if (ack === data.text) {
										message.t = 'otr-ack';
									}
									return message;
								});
						} else if (data.userId !== Meteor.userId()) {
							return otrRoom.encryptText(ack)
								.then((ack) => {
									Meteor.call('updateOTRAck', message._id, ack);
									return message;
								});
						} else {
							return message;
						}
					});
			}
		} else {
			if (message.t === 'otr') {
				message.msg = '';
			}
			return Promise.resolve(message);
		}
	}, RocketChat.promises.priority.HIGH);
});
