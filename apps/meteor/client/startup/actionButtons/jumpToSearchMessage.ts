import { Meteor } from 'meteor/meteor';

import { ui } from '../../lib/ui';
import { messageArgs } from '../../lib/utils/messageArgs';
import { setMessageJumpQueryStringParameter } from '../../lib/utils/setMessageJumpQueryStringParameter';

Meteor.startup(() => {
	ui.addMessageAction({
		id: 'jump-to-search-message',
		icon: 'jump',
		label: 'Jump_to_message',
		context: ['search'],
		async action(_, props) {
			const { message = messageArgs(this).msg } = props;
			setMessageJumpQueryStringParameter(message._id);
		},
		order: 100,
		group: 'menu',
	});
});
