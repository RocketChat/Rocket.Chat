import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { sdk } from '../../utils/client/lib/SDKClient';
import { slashCommands } from '../../utils/client/slashCommand';
/*
 * Unflip is a named function that will replace /unflip commands
 * @param {Object} message - The message object
 */

slashCommands.add({
	command: 'unflip',
	callback: async ({ message, params }: SlashCommandCallbackParams<'unflip'>): Promise<void> => {
		const msg = message;
		await sdk.call('sendMessage', { ...msg, msg: `${params} ┬─┬ ノ( ゜-゜ノ)` });
	},
	options: {
		description: 'Slash_TableUnflip_Description',
		params: 'your_message_optional',
		clientOnly: true,
	},
});
