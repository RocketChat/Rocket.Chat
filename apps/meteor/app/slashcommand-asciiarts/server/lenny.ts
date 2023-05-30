import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { slashCommands } from '../../utils/lib/slashCommand';
import { executeSendMessage } from '../../lib/server/methods/sendMessage';
/*
 * Lenny is a named function that will replace /lenny commands
 * @param {Object} message - The message object
 */

async function LennyFace({ message, params, userId }: SlashCommandCallbackParams<'lenny'>): Promise<void> {
	const msg = message;
	msg.msg = `${params} ( ͡° ͜ʖ ͡°)`;
	await executeSendMessage(userId, msg);
}

slashCommands.add({
	command: 'lennyface',
	callback: LennyFace,
	options: {
		description: 'Slash_LennyFace_Description',
		params: 'your_message_optional',
	},
});
