import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../utils/lib/slashCommand';
/*
 * Shrug is a named function that will replace /shrug commands
 * @param {Object} message - The message object
 */

slashCommands.add({
	command: 'shrug',
	callback: async (_command: 'shrug', params, item): Promise<void> => {
		const msg = item;
		msg.msg = `${params} ¯\\\\_(ツ)_/¯`;
		await Meteor.callAsync('sendMessage', msg);
	},
	options: {
		description: 'Slash_Shrug_Description',
		params: 'your_message_optional',
	},
});
