import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { executeSendMessage } from '../../lib/server/methods/sendMessage';
import { slashCommands } from '../../utils/lib/slashCommand';
/*
 * Cheer is a named function that will replace /cheer commands
 * @param {Object} message - The message object
 */

slashCommands.add({
	command: 'cheer',
	callback: async ({ message, params, userId }: SlashCommandCallbackParams<'cheer'>): Promise<void> => {
		const msg = message;
		msg.msg = `${params} \\(^o^)/`;
		await executeSendMessage(userId, msg);
	},
	options: {
		description: 'Slash_Cheer_Description',
		params: 'your_message_optional',
		clientOnly: true,
	},
});
