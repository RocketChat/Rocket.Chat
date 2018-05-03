Meteor.methods({
	snippetMessage(message) {
		if (typeof Meteor.userId() === 'undefined' || Meteor.userId() === null) {
			return false;
		}
		if ((typeof RocketChat.settings.get('Message_AllowSnippeting') === 'undefined') ||
			(RocketChat.settings.get('Message_AllowSnippeting') === null) ||
			(RocketChat.settings.get('Message_AllowSnippeting') === false)) {
			return false;
		}

		const subscription = RocketChat.models.Subscriptions.findOne({ rid: message.rid, 'u._id': Meteor.userId() });

		if (subscription === undefined) {
			return false;
		}
		ChatMessage.update({
			_id: message._id
		}, {
			$set: {
				snippeted: true
			}
		});
	}
});
