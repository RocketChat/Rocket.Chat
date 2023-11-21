import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { executeSendMessage } from '../../lib/server/methods/sendMessage';
import { slashCommands } from '../../utils/lib/slashCommand';
/*
 * cry is a named function that will replace /cry commands
 * @param {Object} message - The message object
 */

async function cry({ message, params, userId }: SlashCommandCallbackParams<'cry'>): Promise<void> {
	const msg = message;
	msg.msg = `${params} (╥﹏╥)`;
	await executeSendMessage(userId, msg);
}

slashCommands.add({
	command: 'cry',
	callback: cry,
	options: {
		description: 'Slash_cry_Description',
		params: 'your_message_optional',
		clientOnly: true,
	},
});
