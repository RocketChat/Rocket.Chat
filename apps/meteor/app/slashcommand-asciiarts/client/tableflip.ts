import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { sdk } from '../../utils/client/lib/SDKClient';
import { ui } from '../../../client/lib/ui';

/*
 * Tableflip is a named function that will replace /Tableflip commands
 * @param {Object} message - The message object
 */

ui.addSlashCommand({
	command: 'tableflip',
	callback: async ({ message, params }: SlashCommandCallbackParams<'tableflip'>): Promise<void> => {
		const msg = message;
		await sdk.call('sendMessage', { ...msg, msg: `${params} (╯°□°）╯︵ ┻━┻` });
	},
	options: {
		description: 'Slash_Tableflip_Description',
		params: 'your_message_optional',
		clientOnly: true,
	},
});
