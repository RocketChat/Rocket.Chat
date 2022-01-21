import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../utils/lib/slashCommand';
/*
 * Shrug is a named function that will replace /shrug commands
 * @param {Object} message - The message object
 */

function Shrug(command:string, params:Record<string, string>, item:Record<string, string>) {
	if (command === 'shrug') {
		const msg = item;
		msg.msg = `${params} ¯\\_(ツ)_/¯`;
		Meteor.call('sendMessage', msg);
	}
}

slashCommands.add('shrug', Shrug, {
	description: 'Slash_Shrug_Description',
	params: 'your_message_optional',
});
