import { Meteor } from 'meteor/meteor';

import { MessageAction } from '../../../app/ui-utils/client';
import { messageArgs } from '../../lib/utils/messageArgs';
import { setMessageJumpQueryStringParameter } from '../../lib/utils/setMessageJumpQueryStringParameter';

Meteor.startup(() => {
	MessageAction.addButton({
		id: 'jump-to-message',
		icon: 'jump',
		label: 'Jump_to_message',
		context: ['mentions', 'threads', 'videoconf-threads'],
		action(_, props) {
			const { message = messageArgs(this).msg } = props;
			setMessageJumpQueryStringParameter(message._id);
		},
		order: 100,
		group: ['message', 'menu'],
	});
});
