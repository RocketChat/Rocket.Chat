import { slashCommands } from '../../lib/slashCommand';

slashCommands.add({
	command: 'archive',
	options: {
		description: 'Archive',
		params: '#channel',
		permission: 'archive-room',
	},
	providesPreview: false,
});
