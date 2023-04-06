import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../utils/lib/slashCommand';
/*
 * Unflip is a named function that will replace /unflip commands
 * @param {Object} message - The message object
 */

slashCommands.add({
	command: 'unflip',
	callback: async (_command: 'unflip', params, item): Promise<void> => {
		const msg = item;
		msg.msg = `${params} ┬─┬ ノ( ゜-゜ノ)`;
		await Meteor.callAsync('sendMessage', msg);
	},
	options: {
		description: 'Slash_TableUnflip_Description',
		params: 'your_message_optional',
	},
});
