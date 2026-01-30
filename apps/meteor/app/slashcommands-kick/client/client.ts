import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { slashCommands } from '../../utils/client/slashCommand';

slashCommands.add({
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
