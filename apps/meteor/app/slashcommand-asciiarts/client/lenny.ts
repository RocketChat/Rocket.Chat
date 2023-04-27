import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../utils/lib/slashCommand';
/*
 * Lenny is a named function that will replace /lenny commands
 * @param {Object} message - The message object
 */

async function LennyFace({ message, params }: SlashCommandCallbackParams<'lenny'>): Promise<void> {
	const msg = message;
	msg.msg = `${params} ( ͡° ͜ʖ ͡°)`;
	await Meteor.callAsync('sendMessage', msg);
}

slashCommands.add({
	command: 'lennyface',
	callback: LennyFace,
	options: {
		description: 'Slash_LennyFace_Description',
		params: 'your_message_optional',
	},
});
