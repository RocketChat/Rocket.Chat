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
		action() {
			const message = this._arguments[1];

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
					swal('Nice!', `Snippet '${ filename }' created.`, 'success');
				});
			});

		},
		validation(message) {
			if (RocketChat.models.Subscriptions.findOne({ rid: message.rid, 'u._id': Meteor.userId() }) === undefined) {
				return false;
			}

			if (message.snippeted || ((RocketChat.settings.get('Message_AllowSnippeting') === undefined) ||
				(RocketChat.settings.get('Message_AllowSnippeting') === null) ||
				(RocketChat.settings.get('Message_AllowSnippeting')) === false)) {
				return false;
			}

			return RocketChat.authz.hasAtLeastOnePermission('snippet-message', message.rid);
		}
	});
});
