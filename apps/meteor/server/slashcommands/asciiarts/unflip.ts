import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { slashCommands } from '../../lib/utils/slashCommand';
import { executeSendMessage } from '../../meteor-methods/messages/sendMessage';
/*
 * Unflip is a named function that will replace /unflip commands
 * @param {Object} message - The message object
 */

slashCommands.add({
	command: 'unflip',
	callback: async ({ message, params, userId }: SlashCommandCallbackParams<'unflip'>): Promise<void> => {
		const msg = message;
		msg.msg = `${params} ┬─┬ ノ( ゜-゜ノ)`;
		await executeSendMessage(userId, msg);
	},
	options: {
		description: 'Slash_TableUnflip_Description',
		params: 'your_message_optional',
		clientOnly: true,
	},
});
