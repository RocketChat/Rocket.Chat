Meteor.startup(function() {
	RocketChat.MessageAction.addButton({
		id: 'snippeted-message',
		icon: 'code',
		label: 'Snippet',
		context: [
			'snippeted',
			'message',
			'message-mobile'
		],
		order: 10,
		group: 'menu',
		action() {
			const message = this._arguments[1];

			modal.open({
				title: 'Create a Snippet',
				text: 'The name of your snippet (with file extension):',
				type: 'input',
				showCancelButton: true,
				closeOnConfirm: false,
				inputPlaceholder: 'Snippet name'
			}, function(filename) {
				if (filename === false) {
					return false;
				}
				if (filename === '') {
					modal.showInputError('You need to write something!');
					return false;
				}
				message.snippeted = true;
				Meteor.call('snippetMessage', message, filename, function(error) {
					if (error) {
						return handleError(error);
					}
					modal.open({
						title: t('Nice'),
						text: `Snippet '${ filename }' created.`,
						type: 'success',
						timer: 2000
					});
				});
			});

		},
		condition(message) {
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
