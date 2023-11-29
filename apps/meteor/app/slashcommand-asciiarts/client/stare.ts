import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { sdk } from '../../utils/client/lib/SDKClient';
import { slashCommands } from '../../utils/lib/slashCommand';
/*
 * stare is a named function that will replace /stare commands
 * @param {Object} message - The message object
 */

slashCommands.add({
	command: 'stare',
	callback: async ({ message, params }: SlashCommandCallbackParams<'stare'>): Promise<void> => {
		const msg = message;
		await sdk.call('sendMessage', { ...msg, msg: `${params} (⊙_⊙)` });
	},	
	options: {
		description: 'Slash_Stare_Description',
		params: 'your_message_optional',
		clientOnly: true,
	},
});
