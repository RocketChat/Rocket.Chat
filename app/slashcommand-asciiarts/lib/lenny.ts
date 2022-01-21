import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../utils/lib/slashCommand';
/*
 * Lenny is a named function that will replace /lenny commands
 * @param {Object} message - The message object
 */

function LennyFace(command:string, params:Record<string, string>, item:Record<string, string>) {
	if (command === 'lennyface') {
		const msg = item;
		msg.msg = `${params} ( ͡° ͜ʖ ͡°)`;
		Meteor.call('sendMessage', msg);
	}
}

slashCommands.add('lennyface', LennyFace, {
	description: 'Slash_LennyFace_Description',
	params: 'your_message_optional',
});
