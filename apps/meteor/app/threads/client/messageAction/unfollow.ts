import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { Messages } from '../../../models/client';
import { settings } from '../../../settings/client';
import { callWithErrorHandling } from '../../../../client/lib/utils/callWithErrorHandling';
import { dispatchToastMessage } from '../../../../client/lib/toast';
import { t } from '../../../utils/lib/i18n';
import { ui } from '../../../../client/lib/ui';

Meteor.startup(function () {
	Tracker.autorun(() => {
		if (!settings.get('Threads_enabled')) {
			ui.removeMessageAction('unfollow-message');
			return;
		}

		ui.addMessageAction({
			id: 'unfollow-message',
			icon: 'bell-off',
			label: 'Unfollow_message',
			context: ['message', 'message-mobile', 'threads', 'federated'],
			async action(_, { message }) {
				if (!message) {
					return;
				}

				await callWithErrorHandling('unfollowMessage', { mid: message._id });
				dispatchToastMessage({
					type: 'success',
					message: t('You_unfollowed_this_message'),
				});
			},
			condition({ message: { _id, tmid, replies = [] }, user, context }) {
				if (tmid || context) {
					const parentMessage = Messages.findOne({ _id: tmid || _id }, { fields: { replies: 1 } });
					if (parentMessage) {
						replies = parentMessage.replies || [];
					}
				}
				return user?._id ? replies.includes(user._id) : false;
			},
			order: 2,
			group: 'menu',
		});
	});
});
