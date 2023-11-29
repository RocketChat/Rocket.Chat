import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { sdk } from '../../utils/client/lib/SDKClient';
import { slashCommands } from '../../utils/lib/slashCommand';
/*
 * cry is a named function that will replace /cry commands
 * @param {Object} message - The message object
 */

slashCommands.add({
	command: 'cry',
	callback: async ({ message, params }: SlashCommandCallbackParams<'cry'>): Promise<void> => {
		const msg = message;
		await sdk.call('sendMessage', { ...msg, msg: `${params} (╥﹏╥)` });
	},	
	options: {
		description: 'Slash_Cry_Description',
		params: 'your_message_optional',
		clientOnly: true,
	},
});
