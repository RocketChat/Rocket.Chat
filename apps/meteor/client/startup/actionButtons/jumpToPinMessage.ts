import { Meteor } from 'meteor/meteor';

import { MessageAction } from '../../../app/ui-utils/client';
import { jumpToMessage } from '../../lib/utils/jumpToMessage';
import { messageArgs } from '../../lib/utils/messageArgs';

Meteor.startup(() => {
	MessageAction.addButton({
		id: 'jump-to-pin-message',
		icon: 'jump',
		label: 'Jump_to_message',
		context: ['pinned', 'message-mobile', 'direct'],
		action(_, props) {
			const { message = messageArgs(this).msg } = props;
			jumpToMessage(message);
		},
		condition({ subscription }) {
			return !!subscription;
		},
		order: 100,
		group: ['message', 'menu'],
	});
});
