import moment from 'moment';
import toastr from 'toastr';

Meteor.methods({
	deleteMessage(message) {
		if (!Meteor.userId()) {
			return false;
		}

		//We're now only passed in the `_id` property to lower the amount of data sent to the server
		message = ChatMessage.findOne({ _id: message._id });

		const hasPermission = RocketChat.authz.hasAtLeastOnePermission('delete-message', message.rid);
		const deleteAllowed = RocketChat.settings.get('Message_AllowDeleting');
		let deleteOwn = false;
		if (message && message.u && message.u._id) {
			deleteOwn = message.u._id === Meteor.userId();
		}

		if (!(hasPermission || (deleteAllowed && deleteOwn))) {
			return false;
		}

		const blockDeleteInMinutes = RocketChat.settings.get('Message_AllowDeleting_BlockDeleteInMinutes');
		if (_.isNumber(blockDeleteInMinutes) && blockDeleteInMinutes !== 0) {
			if (message.ts) {
				const msgTs = moment(message.ts);
				if (msgTs) {
					const currentTsDiff = moment().diff(msgTs, 'minutes');
					if (currentTsDiff > blockDeleteInMinutes) {
						toastr.error(t('error-message-deleting-blocked'));
						return false;
					}
				}
			}
		}

		Tracker.nonreactive(function() {
			ChatMessage.remove({
				_id: message._id,
				'u._id': Meteor.userId()
			});
		});
	}
});
