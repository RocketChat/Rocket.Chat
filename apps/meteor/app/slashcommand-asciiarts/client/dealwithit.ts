import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { sdk } from '../../utils/client/lib/SDKClient';
import { slashCommands } from '../../utils/lib/slashCommand';
/*
 * Dealwithit is a named function that will replace /dealwithit commands
 * @param {Object} message - The message object
 */

slashCommands.add({
	command: 'dealwithit',
	callback: async ({ message, params }: SlashCommandCallbackParams<'dealwithit'>): Promise<void> => {
		const msg = message;
		await sdk.call('sendMessage', { ...msg, msg: `${params} (⌐■_■)` });
	},
	options: {
		description: 'Slash_Dealwithit_Description',
		params: 'your_message_optional',
		clientOnly: true,
	},
});
