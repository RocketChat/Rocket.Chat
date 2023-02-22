import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import type { IUser } from '@rocket.chat/core-typings';

import { canDeleteMessage } from '../../../authorization/server/functions/canDeleteMessage';
import { Messages } from '../../../models/server';
import { deleteMessage } from '../functions';
import { methodDeprecationLogger } from '../lib/deprecationWarningLogger';

Meteor.methods({
	async deleteMessage(message) {
		methodDeprecationLogger.warn(
			'deleteMessage method is deprecated, instead use the `deleteMessage` function under the `apps/meteor/app/lib/server/functions`',
		);

		check(
			message,
			Match.ObjectIncluding({
				_id: String,
			}),
		);

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
				files: 1,
				ts: 1,
			},
		});

		if (!originalMessage || !canDeleteMessage(uid, originalMessage)) {
			throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
				method: 'deleteMessage',
				action: 'Delete_message',
			});
		}

		return deleteMessage(originalMessage, Meteor.user() as IUser);
	},
});
