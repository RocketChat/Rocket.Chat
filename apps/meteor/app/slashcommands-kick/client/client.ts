import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { queryClient } from '../../../client/lib/queryClient';
import { roomsQueryKeys } from '../../../client/lib/queryKeys';
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
	result: (err, _result, params) => {
		if (!err) void queryClient.invalidateQueries({ queryKey: [...roomsQueryKeys.room(params.msg.rid), 'members'] });
	},
});
