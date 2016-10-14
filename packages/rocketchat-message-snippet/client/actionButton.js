Meteor.startup(function() {
	RocketChat.MessageAction.addButton({
		id: 'snippeted-message',
		icon: 'icon-code',
		i18nLabel: 'Snippet',
		context: [
			'snippeted',
			'message',
			'message-mobile'
		],
		action: function() {
			let message = this._arguments[1];

			swal({
				title: 'Create a Snippet',
				text: 'The name of your snippet (with file extension):',
				type: 'input',
				showCancelButton: true,
				closeOnConfirm: false,
				animation: 'slide-from-top',
				inputPlaceholder: 'Snippet name'
			}, function(filename) {
				if (filename === false) {
					return false;
				}
				if (filename === '') {
					swal.showInputError('You need to write something!');
					return false;
				}
				message.snippeted = true;
				Meteor.call('snippetMessage', message, filename, function(error) {
					if (error) {
						return handleError(error);
					}
					swal('Nice!', `Snippet '${filename}' created.`, 'success');
				});
			});

		},
		validation: function(message) {
			let room = RocketChat.models.Rooms.findOne({_id: message.rid});

			if (Array.isArray(room.usernames) && (room.usernames.indexOf(Meteor.user().username) === -1)) {
				return false;
			} else {
				if (message.snippeted || ((RocketChat.settings.get('Message_AllowSnippeting') === undefined) ||
										(RocketChat.settings.get('Message_AllowSnippeting') === null))) {
					return false;
				}
				return RocketChat.authz.hasAtLeastOnePermission('snippet-message', message.rid);
			}
		}
	});
});
