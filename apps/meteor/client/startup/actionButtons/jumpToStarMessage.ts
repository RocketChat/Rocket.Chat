import { Meteor } from 'meteor/meteor';

import { settings } from '../../../app/settings/client';
import { MessageAction } from '../../../app/ui-utils/client';
import { jumpToMessage } from '../../lib/utils/jumpToMessage';
import { messageArgs } from '../../lib/utils/messageArgs';

Meteor.startup(() => {
	MessageAction.addButton({
		id: 'jump-to-star-message',
		icon: 'jump',
		label: 'Jump_to_message',
		context: ['starred', 'threads', 'message-mobile'],
		action(_, props) {
			const { message = messageArgs(this).msg } = props;
			jumpToMessage(message);
		},
		condition({ message, subscription, user }) {
			if (subscription == null || !settings.get('Message_AllowStarring')) {
				return false;
			}

			return Boolean(message.starred?.find((star) => star._id === user?._id));
		},
		order: 100,
		group: ['message', 'menu'],
	});
});
