import { slashCommands } from '../../utils/lib/slashCommand';

slashCommands.add('invite-all-to', undefined, {
	description: 'Invite_user_to_join_channel_all_to',
	params: '#room',
	permission: ['add-user-to-joined-room', 'add-user-to-any-c-room', 'add-user-to-any-p-room'],
});
slashCommands.add('invite-all-from', undefined, {
	description: 'Invite_user_to_join_channel_all_from',
	params: '#room',
	permission: 'add-user-to-joined-room',
});
