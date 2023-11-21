import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { executeSendMessage } from '../../lib/server/methods/sendMessage';
import { slashCommands } from '../../utils/lib/slashCommand';
/*
 * Happy is a named function that will replace /happy commands
 * @param {Object} message - The message object
 */

async function Happy({ message, params, userId }: SlashCommandCallbackParams<'happy'>): Promise<void> {
	const msg = message;
	msg.msg = `${params} (^_^)`;
	await executeSendMessage(userId, msg);
}

slashCommands.add({
	command: 'happy',
	callback: Happy,
	options: {
		description: 'Slash_Happy_Description',
		params: 'your_message_optional',
		clientOnly: true,
	},
});
