import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { sdk } from '../../utils/client/lib/SDKClient';
import { slashCommands } from '../../utils/lib/slashCommand';
/*
 * Cheer is a named function that will replace /cheer commands
 * @param {Object} message - The message object
 */

slashCommands.add({
	command: 'cheer',
	callback: async ({ message, params }: SlashCommandCallbackParams<'cheer'>): Promise<void> => {
		const msg = message;
		await sdk.call('sendMessage', { ...msg, msg: `${params} \\(^o^)/` });
	},
	options: {
		description: 'Slash_Cheer_Description',
		params: 'your_message_optional',
		clientOnly: true,
	},
});
