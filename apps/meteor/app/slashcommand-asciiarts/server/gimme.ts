import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { executeSendMessage } from '../../lib/server/methods/sendMessage';
import { slashCommands } from '../../utils/server/slashCommand';
/*
 * Gimme is a named function that will replace /gimme commands
 * @param {Object} message - The message object
 */

async function Gimme({ message, params, userId }: SlashCommandCallbackParams<'gimme'>): Promise<void> {
	const msg = message;
	msg.msg = `༼ つ ◕_◕ ༽つ ${params}`;
	await executeSendMessage(userId, msg);
}

slashCommands.add({
	command: 'gimme',
	callback: Gimme,
	options: {
		description: 'Slash_Gimme_Description',
		params: 'your_message_optional',
		clientOnly: true,
	},
});
