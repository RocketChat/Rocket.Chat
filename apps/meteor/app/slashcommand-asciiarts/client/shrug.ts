import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { sdk } from '../../utils/client/lib/SDKClient';
import { ui } from '../../../client/lib/ui';

/*
 * Shrug is a named function that will replace /shrug commands
 * @param {Object} message - The message object
 */

ui.addSlashCommand({
	command: 'shrug',
	callback: async ({ message, params }: SlashCommandCallbackParams<'shrug'>): Promise<void> => {
		const msg = message;
		await sdk.call('sendMessage', { ...msg, msg: `${params} ¯\\\\_(ツ)_/¯` });
	},
	options: {
		description: 'Slash_Shrug_Description',
		params: 'your_message_optional',
		clientOnly: true,
	},
});
