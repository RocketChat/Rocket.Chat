import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { slashCommands } from '../../lib/utils/slashCommand';
import { executeSendMessage } from '../../meteor-methods/messages/sendMessage';

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
