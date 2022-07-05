import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../utils/lib/slashCommand';
/*
 * Tableflip is a named function that will replace /Tableflip commands
 * @param {Object} message - The message object
 */

slashCommands.add({
	command: 'tableflip',
	callback: (_command, params, item): void => {
		const msg = item;
		msg.msg = `${params} (╯°□°）╯︵ ┻━┻`;
		Meteor.call('sendMessage', msg);
	},
	options: {
		description: 'Slash_Tableflip_Description',
		params: 'your_message_optional',
	},
});
