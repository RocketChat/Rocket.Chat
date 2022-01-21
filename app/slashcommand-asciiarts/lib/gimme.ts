import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../utils/lib/slashCommand';
/*
 * Gimme is a named function that will replace /gimme commands
 * @param {Object} message - The message object
 */

function Gimme(command:string, params:Record<string, any>, item:Record<string, any>) {
	if (command === 'gimme') {
		const msg = item;
		msg.msg = `༼ つ ◕_◕ ༽つ ${params}`;
		Meteor.call('sendMessage', msg);
	}
}

slashCommands.add('gimme', Gimme, {
	description: 'Slash_Gimme_Description',
	params: 'your_message_optional',
});
