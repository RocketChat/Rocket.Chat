import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

// import { Subscriptions } from '../../models/client';
import { settings } from '../../../settings/client';
// import { hasPermission } from '../../authorization/client';
import { MessageAction } from '../../../ui-utils/client';
// import { messageArgs } from '../../../ui-utils/client/lib/messageArgs';
// import { t } from '../../../utils/client';

Meteor.startup(function() {
	Tracker.autorun(() => {
		if (!settings.get('Thread_enabled')) {
			return MessageAction.removeButton('reply-thread');
		}

		MessageAction.addButton({
			id: 'reply-thread',
			icon: 'thread',
			label: 'Thread_start',
			context: ['message', 'message-mobile'],
			async action() {
				// const { msg: message } = messageArgs(this);
				// const tabBar = Template.instance().tabBar;
				// tabBar.setTemplate('thread');
				// tabBar.open();
				// tabBar.setData({ message, icon: 'reply', label: 'Thread' });
			},
			condition() {
				return true;
			},
			order: 0,
			group: 'message',
		});
	});
});
