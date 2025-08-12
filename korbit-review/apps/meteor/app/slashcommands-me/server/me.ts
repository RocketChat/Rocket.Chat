import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { executeSendMessage } from '../../lib/server/methods/sendMessage';
import { slashCommands } from '../../utils/server/slashCommand';

/*
 * Me is a named function that will replace /me commands
 * @param {Object} message - The message object
 */
slashCommands.add({
	command: 'me',
	callback: async function Me({ params, message, userId }: SlashCommandCallbackParams<'me'>): Promise<void> {
		if (params.trim()) {
			const msg = message;
			msg.msg = `_${params}_`;
			await executeSendMessage(userId, msg);
		}
	},
	options: {
		description: 'Displays_action_text',
		params: 'your_message',
	},
});
