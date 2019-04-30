import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import moment from 'moment';

import { hasPermission } from '../../../authorization';
import { settings } from '../../../settings';
import { Messages } from '../../../models';
import { deleteMessage } from '../functions';

Meteor.methods({
	deleteMessage(message) {
		check(message, Match.ObjectIncluding({
			_id: String,
		}));
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'deleteMessage',
			});
		}
		const originalMessage = Messages.findOneById(message._id, {
			fields: {
				u: 1,
				rid: 1,
				file: 1,
				ts: 1,
			},
		});
		if (originalMessage == null) {
			throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
				method: 'deleteMessage',
				action: 'Delete_message',
			});
		}
		const forceDelete = hasPermission(Meteor.userId(), 'force-delete-message', originalMessage.rid);
		const _hasPermission = hasPermission(Meteor.userId(), 'delete-message', originalMessage.rid);
		const deleteAllowed = settings.get('Message_AllowDeleting');
		const deleteOwn = originalMessage && originalMessage.u && originalMessage.u._id === Meteor.userId();
		if (!(_hasPermission || (deleteAllowed && deleteOwn)) && !forceDelete) {
			throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
				method: 'deleteMessage',
				action: 'Delete_message',
			});
		}
		const blockDeleteInMinutes = settings.get('Message_AllowDeleting_BlockDeleteInMinutes');
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
					method: 'deleteMessage',
				});
			}
		}
		return deleteMessage(originalMessage, Meteor.user());
	},
});
