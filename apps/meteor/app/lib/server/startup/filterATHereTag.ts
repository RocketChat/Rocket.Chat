import { api } from '@rocket.chat/core-services';
import { isEditedMessage } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';
import _ from 'underscore';

import { callbacks } from '../../../../lib/callbacks';
import { i18n } from '../../../../server/lib/i18n';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

callbacks.add(
	'beforeSaveMessage',
	async (message) => {
		// If the message was edited, or is older than 60 seconds (imported)
		// the notifications will be skipped, so we can also skip this validation
		if (isEditedMessage(message) || (message.ts && Math.abs(moment(message.ts).diff(moment())) > 60000)) {
			return message;
		}

		// Test if the message mentions include @here.
		if (message.mentions != null && _.pluck(message.mentions, '_id').some((item) => item === 'here')) {
			// Check if the user has permissions to use @here in both global and room scopes.
			if (
				!(await hasPermissionAsync(message.u._id, 'mention-here')) &&
				!(await hasPermissionAsync(message.u._id, 'mention-here', message.rid))
			) {
				// Get the language of the user for the error notification.
				const { language } = (await Users.findOneById(message.u._id)) || {};
				const action = i18n.t('Notify_active_in_this_room', { lng: language });

				// Add a notification to the chat, informing the user that this
				// action is not allowed.
				void api.broadcast('notify.ephemeralMessage', message.u._id, message.rid, {
					// TODO: i18n
					msg: i18n.t('error-action-not-allowed', { action } as any, language),
				});

				// Also throw to stop propagation of 'sendMessage'.
				throw new Meteor.Error('error-action-not-allowed', 'Notify here in this room not allowed', {
					method: 'filterATHereTag',
					action: 'Notify_active_in_this_room',
				});
			}
		}

		return message;
	},
	callbacks.priority.MEDIUM,
	'filterATHereTag',
);
