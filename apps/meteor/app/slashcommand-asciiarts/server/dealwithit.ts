import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { executeSendMessage } from '../../lib/server/methods/sendMessage';
import { slashCommands } from '../../utils/lib/slashCommand';
/*
 * Dealwithit is a named function that will replace /dealwithit commands
 * @param {Object} message - The message object
 */

slashCommands.add({
	command: 'dealwithit',
	callback: async ({ message, params, userId }: SlashCommandCallbackParams<'dealwithit'>): Promise<void> => {
		const msg = message;
		msg.msg = `${params} (⌐■_■)`;
		await executeSendMessage(userId, msg);
	},
	options: {
		description: 'Slash_Dealwithit_Description',
		params: 'your_message_optional',
		clientOnly: true,
	},
});
