import { slashCommands } from '../../utils/lib/slashCommand';

slashCommands.add(
	'kick',
	function (_command: 'kick', params: string) {
		const username = params.trim();
		if (username === '') {
			return;
		}
		return username.replace('@', '');
	},
	{
		description: 'Remove_someone_from_room',
		params: '@username',
		permission: 'remove-user',
	},
);
