import { queryClient } from '../../lib/queryClient';
import { roomsQueryKeys } from '../../lib/queryKeys';
import { slashCommands } from '../../lib/slashCommand';

slashCommands.add({
	command: 'invite',
	options: {
		description: 'Invite_user_to_join_channel',
		params: '@username',
		permission: 'add-user-to-joined-room',
	},
	providesPreview: false,
	result: (err, _result, params) => {
		if (!err) void queryClient.invalidateQueries({ queryKey: [...roomsQueryKeys.room(params.msg.rid), 'members'] });
	},
});
