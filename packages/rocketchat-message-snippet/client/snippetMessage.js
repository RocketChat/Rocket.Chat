Meteor.methods({
	snippetMessage: function(message) {
		if (typeof Meteor.userId() == "undefined" || Meteor.userId() == null) {
			return false;
		}
		if ((typeof RocketChat.settings.get('Message_AllowSnippeting') == "undefined") || (
			RocketChat.settings.get('Message_AllowSnippeting') == null)) {
			return false;
		}

		let room = RocketChat.models.Rooms.findOne({ _id: message.rid });

		if (Array.isArray(room.usernames) && room.usernames.indexOf(Meteor.user().username) == -1) {
			return false;
		}
		ChatMessage.update({
            _id: message._id,
        }, {
            $set: {
                snippeted: true
            }
        });
	}
});
