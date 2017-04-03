Meteor.methods({
	pinMessage(message) {
		if (!Meteor.userId()) {
			return false;
		}
		if (!RocketChat.settings.get('Message_AllowPinning')) {
			return false;
		}
		if (RocketChat.models.Subscriptions.findOne({ rid: message.rid }) == null) {
			return false;
		}
		return ChatMessage.update({
			_id: message._id
		}, {
			$set: {
				pinned: true
			}
		});
	},
	unpinMessage(message) {
		if (!Meteor.userId()) {
			return false;
		}
		if (!RocketChat.settings.get('Message_AllowPinning')) {
			return false;
		}
		if (RocketChat.models.Subscriptions.findOne({ rid: message.rid }) == null) {
			return false;
		}
		return ChatMessage.update({
			_id: message._id
		}, {
			$set: {
				pinned: false
			}
		});
	}
});
