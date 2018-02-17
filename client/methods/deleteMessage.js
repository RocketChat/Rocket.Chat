import _ from 'underscore';
import moment from 'moment';

Meteor.methods({
	deleteMessage(message) {
		if (!Meteor.userId()) {
			return false;
		}

		//We're now only passed in the `_id` property to lower the amount of data sent to the server
		message = ChatMessage.findOne({ _id: message._id });

		const hasPermission = RocketChat.authz.hasAtLeastOnePermission('delete-message', message.rid);
		const forceDelete = RocketChat.authz.hasAtLeastOnePermission('force-delete-message', message.rid);
		const deleteAllowed = RocketChat.settings.get('Message_AllowDeleting');
		let deleteOwn = false;

		if (message && message.u && message.u._id) {
			deleteOwn = message.u._id === Meteor.userId();
		}
		if (!(forceDelete || hasPermission || (deleteAllowed && deleteOwn))) {
			return false;
		}
		const blockDeleteInMinutes = RocketChat.settings.get('Message_AllowDeleting_BlockDeleteInMinutes');
		if (!forceDelete && _.isNumber(blockDeleteInMinutes) && blockDeleteInMinutes !== 0) {
			const msgTs = moment(message.ts);
			const currentTsDiff = moment().diff(msgTs, 'minutes');
			if (currentTsDiff > blockDeleteInMinutes) {
				return false;
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
