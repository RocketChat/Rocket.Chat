import { slashCommands } from '../../utils/lib/slashCommand';

slashCommands.add({
	command: 'invite',
	options: {
		description: 'Invite_user_to_join_channel',
		params: '@username',
		permission: 'add-user-to-joined-room',
	},
	providesPreview: false,
});
