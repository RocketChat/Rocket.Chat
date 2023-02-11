import { Meteor } from 'meteor/meteor';

import { MessageAction } from '../../../app/ui-utils/client';
import { jumpToMessage } from '../../lib/utils/jumpToMessage';
import { messageArgs } from '../../lib/utils/messageArgs';

Meteor.startup(() => {
	MessageAction.addButton({
		id: 'jump-to-message',
		icon: 'jump',
		label: 'Jump_to_message',
		context: ['mentions', 'threads'],
		action(_, props) {
			const { message = messageArgs(this).msg } = props;
			jumpToMessage(message);
		},
		order: 100,
		group: ['message', 'menu'],
	});
});
