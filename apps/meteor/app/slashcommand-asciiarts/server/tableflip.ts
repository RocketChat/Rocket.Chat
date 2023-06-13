import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { slashCommands } from '../../utils/lib/slashCommand';
import { executeSendMessage } from '../../lib/server/methods/sendMessage';
/*
 * Tableflip is a named function that will replace /Tableflip commands
 * @param {Object} message - The message object
 */

slashCommands.add({
	command: 'tableflip',
	callback: async ({ message, params, userId }: SlashCommandCallbackParams<'tableflip'>): Promise<void> => {
		const msg = message;
		msg.msg = `${params} (╯°□°）╯︵ ┻━┻`;
		await executeSendMessage(userId, msg);
	},
	options: {
		description: 'Slash_Tableflip_Description',
		params: 'your_message_optional',
	},
});
