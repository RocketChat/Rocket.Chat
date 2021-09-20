import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import toastr from 'toastr';

import { Messages } from '../../../models/client';
import { settings } from '../../../settings/client';
import { MessageAction } from '../../../ui-utils/client';
import { messageArgs } from '../../../ui-utils/client/lib/messageArgs';
import { roomTypes } from '../../../utils/client';
import { callWithErrorHandling } from '../../../../client/lib/utils/callWithErrorHandling';

Meteor.startup(function() {
	Tracker.autorun(() => {
		if (!settings.get('Threads_enabled')) {
			return MessageAction.removeButton('follow-message');
		}
		MessageAction.addButton({
			id: 'follow-message',
			icon: 'bell',
			label: 'Follow_message',
			context: ['message', 'message-mobile', 'threads'],
			async action() {
				const { msg } = messageArgs(this);
				callWithErrorHandling('followMessage', { mid: msg._id }).then(() =>
					toastr.success(TAPi18n.__('You_followed_this_message')),
				);
			},
			condition({ message: { _id, tmid, replies = [] }, room, user, context }) {
				if (tmid || context) {
					const parentMessage = Messages.findOne({ _id: tmid || _id }, { fields: { replies: 1 } });
					if (parentMessage) {
						replies = parentMessage.replies || [];
					}
				}
				const isLivechatRoom = roomTypes.isLivechatRoom(room.t);
				if (isLivechatRoom) {
					return false;
				}
				return !replies.includes(user._id);
			},
			order: 2,
			group: 'menu',
		});
	});
});
