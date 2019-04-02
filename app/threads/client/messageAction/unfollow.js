import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../../settings/client';
// import { hasPermission } from '../../authorization/client';
import { MessageAction, call } from '../../../ui-utils/client';
import { messageArgs } from '../../../ui-utils/client/lib/messageArgs';

Meteor.startup(function() {
	Tracker.autorun(() => {
		if (!settings.get('Thread_enabled')) {
			return MessageAction.removeButton('follow-message');
		}
		MessageAction.addButton({
			id: 'unfollow-message',
			icon: 'thread',
			label: 'Unfollow_message',
			context: ['message', 'message-mobile'],
			async action() {
				const { msg } = messageArgs(this);
				call('unfollowMessage', { mid: msg._id });
			},
			condition({ replies = [] }) {
				return replies.includes(Meteor.userId());
			},
			order: 0,
			group: 'menu',
		});
	});
});
