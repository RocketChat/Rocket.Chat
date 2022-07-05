import { slashCommands } from '../../utils/lib/slashCommand';

slashCommands.add({
	command: 'unarchive',
	options: {
		description: 'Unarchive',
		params: '#channel',
		permission: 'unarchive-room',
	},
	providesPreview: false,
});
