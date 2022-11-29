import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../utils/lib/slashCommand';
/*
 * Unflip is a named function that will replace /unflip commands
 * @param {Object} message - The message object
 */

slashCommands.add({
	command: 'unflip',
	callback: (_command: 'unflip', params, item): void => {
		const msg = item;
		msg.msg = `${params} ┬─┬ ノ( ゜-゜ノ)`;
		Meteor.call('sendMessage', msg);
	},
	options: {
		description: 'Slash_TableUnflip_Description',
		params: 'your_message_optional',
	},
});
