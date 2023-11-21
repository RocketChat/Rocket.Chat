import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { sdk } from '../../utils/client/lib/SDKClient';
import { slashCommands } from '../../utils/lib/slashCommand';
/*
 * Happy is a named function that will replace /Happy commands
 * @param {Object} message - The message object
 */

slashCommands.add({
	command: 'happy',
	callback: async ({ message, params }: SlashCommandCallbackParams<'happy'>): Promise<void> => {
		const msg = message;
		await sdk.call('sendMessage', { ...msg, msg: `${params} (^_^)` });
	},	
	options: {
		description: 'Slash_Happy_Description',
		params: 'your_message_optional',
		clientOnly: true,
	},
});
