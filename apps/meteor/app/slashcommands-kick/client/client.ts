import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { ui } from '../../../client/lib/ui';

ui.addSlashCommand({
	command: 'kick',
	callback({ params }: SlashCommandCallbackParams<'kick'>) {
		const username = params.trim();
		if (username === '') {
			return;
		}
		return username.replace('@', '');
	},
	options: {
		description: 'Remove_someone_from_room',
		params: '@username',
		permission: 'remove-user',
	},
});
