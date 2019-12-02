import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { canDeleteMessage } from '../../../authorization/server/functions/canDeleteMessage';
import { Messages } from '../../../models';
import { deleteMessage } from '../functions';

Meteor.methods({
	deleteMessage(message) {
		check(message, Match.ObjectIncluding({
			_id: String,
		}));

		const uid = Meteor.userId();

		if (!uid) {
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
			return;
			// throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
			// 	method: 'deleteMessage',
			// 	action: 'Delete_message',
			// });
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

		return deleteMessage(originalMessage, Meteor.user());
	},
});
