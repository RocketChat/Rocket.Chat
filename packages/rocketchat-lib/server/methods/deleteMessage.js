import moment from 'moment';

Meteor.methods({
	deleteMessage(message) {
		check(message, Match.ObjectIncluding({
			_id: String
		}));
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'deleteMessage'
			});
		}
		const originalMessage = RocketChat.models.Messages.findOneById(message._id, {
			fields: {
				u: 1,
				rid: 1,
				file: 1,
				ts: 1
			}
		});
		if (originalMessage == null) {
			throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
				method: 'deleteMessage',
				action: 'Delete_message'
			});
		}
		const forceDelete = RocketChat.authz.hasPermission(Meteor.userId(), 'force-delete-message', originalMessage.rid);
		const hasPermission = RocketChat.authz.hasPermission(Meteor.userId(), 'delete-message', originalMessage.rid);
		const deleteAllowed = RocketChat.settings.get('Message_AllowDeleting');
		const deleteOwn = originalMessage && originalMessage.u && originalMessage.u._id === Meteor.userId();
		if (!(hasPermission || (deleteAllowed && deleteOwn)) && !(forceDelete)) {
			throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
				method: 'deleteMessage',
				action: 'Delete_message'
			});
		}
		const blockDeleteInMinutes = RocketChat.settings.get('Message_AllowDeleting_BlockDeleteInMinutes');
		if (blockDeleteInMinutes != null && blockDeleteInMinutes !== 0 && !forceDelete) {
			if (originalMessage.ts == null) {
				return;
			}
			const msgTs = moment(originalMessage.ts);
			if (msgTs == null) {
				return;
			}
			const currentTsDiff = moment().diff(msgTs, 'minutes');
			if (currentTsDiff > blockDeleteInMinutes) {
				throw new Meteor.Error('error-message-deleting-blocked', 'Message deleting is blocked', {
					method: 'deleteMessage'
				});
			}
		}
		return RocketChat.deleteMessage(originalMessage, Meteor.user());
	}
});
