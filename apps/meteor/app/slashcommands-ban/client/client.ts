import { slashCommands } from '../../utils/client/slashCommand';

slashCommands.add({
	command: 'ban',
	options: {
		description: 'Ban_user_from_room',
		params: '@username',
		permission: 'ban-user',
	},
	providesPreview: false,
});

slashCommands.add({
	command: 'unban',
	options: {
		description: 'Unban_user_from_room',
		params: '@username',
		permission: 'ban-user',
	},
	providesPreview: false,
});
