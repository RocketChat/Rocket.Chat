import { slashCommands } from '../../utils/lib/slashCommand';

slashCommands.add({
	command: 'kick',
	callback(_command: 'kick', params: string) {
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
