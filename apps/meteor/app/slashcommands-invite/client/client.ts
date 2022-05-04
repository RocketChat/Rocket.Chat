import { slashCommands } from '../../utils/lib/slashCommand';

slashCommands.add(
	'invite',
	undefined,
	{
		description: 'Invite_user_to_join_channel',
		params: '@username',
		permission: 'add-user-to-joined-room',
	},
	undefined,
	false,
	undefined,
	undefined,
);
