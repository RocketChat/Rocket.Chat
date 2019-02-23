import { Meteor } from 'meteor/meteor';
import { MessageAction, modal } from 'meteor/rocketchat:ui-utils';
import { t, handleError } from 'meteor/rocketchat:utils';
import { settings } from 'meteor/rocketchat:settings';
import { Subscriptions } from 'meteor/rocketchat:models';
import { hasAtLeastOnePermission } from 'meteor/rocketchat:authorization';

Meteor.startup(function() {
	MessageAction.addButton({
		id: 'snippeted-message',
		icon: 'code',
		label: 'Snippet',
		context: [
			'snippeted',
			'message',
			'message-mobile',
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
				inputPlaceholder: 'Snippet name',
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
						timer: 2000,
					});
				});
			});

		},
		condition(message) {
			if (Subscriptions.findOne({ rid: message.rid, 'u._id': Meteor.userId() }) === undefined) {
				return false;
			}

			if (message.snippeted || ((settings.get('Message_AllowSnippeting') === undefined) ||
				(settings.get('Message_AllowSnippeting') === null) ||
				(settings.get('Message_AllowSnippeting')) === false)) {
				return false;
			}

			return hasAtLeastOnePermission('snippet-message', message.rid);
		},
	});
});
