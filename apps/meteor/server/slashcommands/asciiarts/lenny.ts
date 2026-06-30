import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { executeSendMessage } from '../../../app/lib/server/methods/sendMessage';
import { slashCommands } from '../../../app/utils/server/slashCommand';
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
		clientOnly: true,
	},
});
