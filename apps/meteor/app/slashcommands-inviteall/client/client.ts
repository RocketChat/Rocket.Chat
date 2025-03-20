import { slashCommands } from '../../utils/client/slashCommand';

slashCommands.add({
	command: 'invite-all-to',
	options: {
		description: 'Invite_user_to_join_channel_all_to',
		params: '#room',
		permission: ['add-user-to-joined-room', 'add-user-to-any-c-room', 'add-user-to-any-p-room'],
	},
});
slashCommands.add({
	command: 'invite-all-from',
	options: {
		description: 'Invite_user_to_join_channel_all_from',
		params: '#room',
		permission: 'add-user-to-joined-room',
	},
});
