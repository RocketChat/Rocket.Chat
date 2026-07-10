import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { slashCommands } from '../../../app/utils/server/slashCommand';
import { executeSendMessage } from '../../meteor-methods/messages/sendMessage';
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
