import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { executeSendMessage } from '../../lib/server/methods/sendMessage';
import { slashCommands } from '../../utils/lib/slashCommand';
/*
 * stare is a named function that will replace /stare commands
 * @param {Object} message - The message object
 */

async function stare({ message, params, userId }: SlashCommandCallbackParams<'stare'>): Promise<void> {
	const msg = message;
	msg.msg = `${params} (⊙_⊙)`;
	await executeSendMessage(userId, msg);
}

slashCommands.add({
	command: 'stare',
	callback: stare,
	options: {
		description: 'Slash_stare_Description',
		params: 'your_message_optional',
		clientOnly: true,
	},
});
