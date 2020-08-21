import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../authorization';
import { sendViaEmail } from '../../../../server/lib/channelExport';

Meteor.methods({
	'mailMessages'(data) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'mailMessages',
			});
		}
		check(data, Match.ObjectIncluding({
			rid: String,
			to_users: [String],
			to_emails: String,
			subject: String,
			messages: [String],
			language: String,
		}));
		const room = Meteor.call('canAccessRoom', data.rid, userId);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'mailMessages',
			});
		}
		if (!hasPermission(userId, 'mail-messages')) {
			throw new Meteor.Error('error-action-not-allowed', 'Mailing is not allowed', {
				method: 'mailMessages',
				action: 'Mailing',
			});
		}

		const user = Meteor.user();

		const { missing } = sendViaEmail({
			rid: data.rid,
			toUsers: data.to_users,
			toEmails: data.to_emails,
			subject: data.subject,
			messages: data.messages,
			language: data.language,
		}, user);

		return {
			success: true,
			missing,
		};
	},
});
