import { Meteor } from 'meteor/meteor';
import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { slashCommands } from '../../utils/lib/slashCommand';
/*
 * Gimme is a named function that will replace /gimme commands
 * @param {Object} message - The message object
 */
async function Gimme({ message, params }: SlashCommandCallbackParams<'gimme'>): Promise<void> {
	const msg = message;
	msg.msg = `༼ つ ◕_◕ ༽つ ${params}`;
	await Meteor.callAsync('sendMessage', msg);
}

slashCommands.add({
	command: 'gimme',
	callback: Gimme,
	options: {
		description: 'Slash_Gimme_Description',
		params: 'your_message_optional',
	},
});
