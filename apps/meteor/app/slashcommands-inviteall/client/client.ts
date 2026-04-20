import { queryClient } from '../../../client/lib/queryClient';
import { roomsQueryKeys } from '../../../client/lib/queryKeys';
import { slashCommands } from '../../utils/client/slashCommand';

const invalidateMembers = (_err: unknown, _result: unknown, params: { msg: { rid: string } }) => {
	if (!_err) void queryClient.invalidateQueries({ queryKey: [...roomsQueryKeys.room(params.msg.rid), 'members'] });
};

slashCommands.add({
	command: 'invite-all-to',
	options: {
		description: 'Invite_user_to_join_channel_all_to',
		params: '#room',
		permission: ['add-user-to-joined-room', 'add-user-to-any-c-room', 'add-user-to-any-p-room'],
	},
	result: invalidateMembers,
});
slashCommands.add({
	command: 'invite-all-from',
	options: {
		description: 'Invite_user_to_join_channel_all_from',
		params: '#room',
		permission: 'add-user-to-joined-room',
	},
	result: invalidateMembers,
});
