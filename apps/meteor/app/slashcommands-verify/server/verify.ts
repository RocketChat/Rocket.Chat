import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { slashCommands } from '../../utils/lib/slashCommand';
import { Livechat as LivechatTyped } from '../../livechat/server/lib/LivechatTyped';

slashCommands.add({
	command: 'verify',
	callback: async function Verify({ message }: SlashCommandCallbackParams<'verify'>): Promise<void> {
		await LivechatTyped.verificationProcess(message.rid);
		// void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
		// 	msg: i18n.t('Hii', { lng: settings.get('Language') || 'en' }),
		// });
	},
	options: {
		description: 'Start_the_verification_process',
		permission: 'enable-livechat-verification-process',
	},
});
