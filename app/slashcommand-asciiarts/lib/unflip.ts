import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../utils/lib/slashCommand';
/*
 * Unflip is a named function that will replace /unflip commands
 * @param {Object} message - The message object
 */

function Unflip(command:string, params:Record<string, string>, item:Record<string, string>) {
	if (command === 'unflip') {
		const msg = item;
		msg.msg = `${params} ┬─┬ ノ( ゜-゜ノ)`;
		Meteor.call('sendMessage', msg);
	}
}

slashCommands.add('unflip', Unflip, {
	description: 'Slash_TableUnflip_Description',
	params: 'your_message_optional',
});
