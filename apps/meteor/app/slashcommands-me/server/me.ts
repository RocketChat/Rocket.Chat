import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../utils/lib/slashCommand';

/*
 * Me is a named function that will replace /me commands
 * @param {Object} message - The message object
 */
slashCommands.add({
	command: 'me',
	callback: function Me(_command: 'me', params, item): void {
		if (params.trim()) {
			const msg = item;
			msg.msg = `_${params}_`;
			Meteor.call('sendMessage', msg);
		}
	},
	options: {
		description: 'Displays_action_text',
		params: 'your_message',
	},
});
