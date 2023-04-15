import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../utils/lib/slashCommand';
/*
 * Tableflip is a named function that will replace /Tableflip commands
 * @param {Object} message - The message object
 */

slashCommands.add({
	command: 'tableflip',
	callback: async (_command, params, item): Promise<void> => {
		const msg = item;
		msg.msg = `${params} (╯°□°）╯︵ ┻━┻`;
		await Meteor.callAsync('sendMessage', msg);
	},
	options: {
		description: 'Slash_Tableflip_Description',
		params: 'your_message_optional',
	},
});
