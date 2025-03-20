import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { executeSendMessage } from '../../lib/server/methods/sendMessage';
import { slashCommands } from '../../utils/server/slashCommand';
/*
 * Shrug is a named function that will replace /shrug commands
 * @param {Object} message - The message object
 */

slashCommands.add({
	command: 'shrug',
	callback: async ({ message, params, userId }: SlashCommandCallbackParams<'shrug'>): Promise<void> => {
		const msg = message;
		msg.msg = `${params} ¯\\\\_(ツ)_/¯`;
		await executeSendMessage(userId, msg);
	},
	options: {
		description: 'Slash_Shrug_Description',
		params: 'your_message_optional',
		clientOnly: true,
	},
});
