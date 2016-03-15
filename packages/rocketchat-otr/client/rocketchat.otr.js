class OTR {
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

		var subscription;
		subscription = RocketChat.models.Subscriptions.findOne({
			rid: roomId
		});

		if (!subscription || subscription.t !== 'd') {
			return;
		}

		this.instancesByRoomId[roomId] = new RocketChat.OTR.Room(Meteor.userId(), roomId);
		return this.instancesByRoomId[roomId];
	}
}

RocketChat.OTR = new OTR();

Meteor.startup(function() {
	RocketChat.Notifications.onUser('otr', (type, data) => {
		if (!data.roomId || !data.userId || data.userId === Meteor.userId()) {
			return;
		} else {
			RocketChat.OTR.getInstanceByRoomId(data.roomId).onUserStream(type, data);
		}
	});

	RocketChat.promises.add('onClientBeforeSendMessage', function(message) {
		if (message.rid && RocketChat.OTR.getInstanceByRoomId(message.rid) && RocketChat.OTR.getInstanceByRoomId(message.rid).established.get()) {
			return RocketChat.OTR.getInstanceByRoomId(message.rid).encrypt(message.msg)
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
		if (message.rid && RocketChat.OTR.getInstanceByRoomId(message.rid) && RocketChat.OTR.getInstanceByRoomId(message.rid).established.get()) {
			if (message.notification) {
				message.msg = t('Encrypted_message');
				return Promise.resolve(message);
			} else {
				return RocketChat.OTR.instancesByRoomId[message.rid].decrypt(message.msg)
				.then((data) => {
					const {text, ack} = data;
					message.msg = text;
					if (message.otrAck) {
						return RocketChat.OTR.getInstanceByRoomId(message.rid).decrypt(message.otrAck)
						.then((data) => {
							if (ack === data.text) {
								message.t = 'otr-ack';
							}
							return message;
						});
					} else {
						if (data.userId !== Meteor.userId()) {
							return RocketChat.OTR.instancesByRoomId[message.rid].encryptText(ack)
							.then((ack) => {
								Meteor.call('updateOTRAck', message._id, ack);
								return message;
							});
						} else {
							return message;
						}
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
