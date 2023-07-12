import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { sdk } from '../../utils/client/lib/SDKClient';
import { ui } from '../../../client/lib/ui';

/*
 * Gimme is a named function that will replace /gimme commands
 * @param {Object} message - The message object
 */

async function Gimme({ message, params }: SlashCommandCallbackParams<'gimme'>): Promise<void> {
	const msg = message;
	await sdk.call('sendMessage', { ...msg, msg: `༼ つ ◕_◕ ༽つ ${params}` });
}

ui.addSlashCommand({
	command: 'gimme',
	callback: Gimme,
	options: {
		description: 'Slash_Gimme_Description',
		params: 'your_message_optional',
		clientOnly: true,
	},
});
