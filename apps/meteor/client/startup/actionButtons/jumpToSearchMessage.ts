import { Meteor } from 'meteor/meteor';

import { MessageAction } from '../../../app/ui-utils/client';
import { jumpToMessage } from '../../lib/utils/jumpToMessage';
import { messageArgs } from '../../lib/utils/messageArgs';

Meteor.startup(() => {
	MessageAction.addButton({
		id: 'jump-to-search-message',
		icon: 'jump',
		label: 'Jump_to_message',
		context: ['search'],
		async action(_, props) {
			const { message = messageArgs(this).msg } = props;
			await jumpToMessage(message);
		},
		order: 100,
		group: 'menu',
	});
});
