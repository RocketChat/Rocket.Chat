import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';
import { dispatchToastMessage } from '../../../../client/lib/toast';
import { callWithErrorHandling } from '../../../../client/lib/utils/callWithErrorHandling';
import { Messages } from '../../../models/client';
import { settings } from '../../../settings/client';
import { MessageAction } from '../../../ui-utils/client';
import { t } from '../../../utils/lib/i18n';

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (!settings.get('Threads_enabled')) {
			return MessageAction.removeButton('follow-message');
		}
		MessageAction.addButton({
			id: 'follow-message',
			icon: 'bell',
			label: 'Follow_message',
			context: ['message', 'message-mobile', 'threads', 'federated', 'videoconf', 'videoconf-threads'],
			async action(_, { message }) {
				if (!message) {
					return;
				}

				await callWithErrorHandling('followMessage', { mid: message._id }).then(() =>
					dispatchToastMessage({
						type: 'success',
						message: t('You_followed_this_message'),
					}),
				);
			},
			condition({ message: { _id, tmid, replies = [] }, room, user, context }) {
				if (tmid || context) {
					const parentMessage = Messages.findOne({ _id: tmid || _id }, { fields: { replies: 1 } });
					if (parentMessage) {
						replies = parentMessage.replies || [];
					}
				}
				const isLivechatRoom = roomCoordinator.isLivechatRoom(room.t);
				if (isLivechatRoom) {
					return false;
				}
				return user?._id ? !replies.includes(user._id) : false;
			},
			order: 2,
			group: 'menu',
		});
	});
});
