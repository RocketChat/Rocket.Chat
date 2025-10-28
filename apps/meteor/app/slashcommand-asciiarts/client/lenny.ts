import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { sdk } from '../../utils/client/lib/SDKClient';
import { slashCommands } from '../../utils/client/slashCommand';
/*
 * Lenny is a named function that will replace /lenny commands
 * @param {Object} message - The message object
 */

async function LennyFace({ message, params }: SlashCommandCallbackParams<'lenny'>): Promise<void> {
	const msg = message;
	await sdk.call('sendMessage', { ...msg, msg: `${params} ( ͡° ͜ʖ ͡°)` });
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
