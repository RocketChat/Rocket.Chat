/* globals ChatSubscription */
class OTR {
	constructor() {
		this.enabled = new ReactiveVar(false);
		this.instancesByRoomId = {};
	}

	isEnabled() {
		return this.enabled.get();
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
		if (message.rid && RocketChat.OTR.instancesByRoomId && RocketChat.OTR.instancesByRoomId[message.rid] && RocketChat.OTR.instancesByRoomId[message.rid].established.get()) {
			return RocketChat.OTR.instancesByRoomId[message.rid].encrypt(message.msg)
			.then((msg) => {
				message.msg = msg;
				return message;
			});
		} else {
			return Promise.resolve(message);
		}
	}, RocketChat.promises.priority.HIGH);

	RocketChat.promises.add('onClientMessageReceived', function(message) {
		if (message.rid && RocketChat.OTR.instancesByRoomId && RocketChat.OTR.instancesByRoomId[message.rid] && RocketChat.OTR.instancesByRoomId[message.rid].established.get()) {
			if (message.notification) {
				message.msg = t('Encrypted_message');
				return Promise.resolve(message);
			} else {
				return RocketChat.OTR.instancesByRoomId[message.rid].decrypt(message.msg)
				.then((msg) => {
					message.msg = msg;
					return message;
				});
			}
		} else {
			return Promise.resolve(message);
		}
	}, RocketChat.promises.priority.HIGH);
});
