Meteor.startup(function() {
	RocketChat.MessageAction.addButton({
		id: "snippeted-message",
		icon: "icon-code",
		i18nnLabel: 'Snippet',
		context: [
			'snippeted',
			'message',
			'message-mobile'
		],
		action: function(event, instance) {
			let message = this._arguments[1];
			message.snippeted = true;
			Meteor.call('snippetMessage', message, function(error, result) {
				if (error) {
					return handleError(error);
				}
			})
		},
		validation: function(message) {
			let room = RocketChat.models.Rooms.findOne({_id: message.rid});

			if (Array.isArray(room.usernames) && (room.usernames.indexOf(Meteor.user().username) == -1)) {
				console.log("Nope Array");
				return false;
			} else {
				if (message.snippeted || ((typeof RocketChat.settings.get('Message_AllowSnippeting') == "undefined") ||
										(RocketChat.settings.get("Message_AllowSnippeting") == null))) {
					return false;
				} else {
					return RocketChat.authz.hasAtLeastOnePermission('snippet-message', message.rid);
				}
			}
		}
    });
});
