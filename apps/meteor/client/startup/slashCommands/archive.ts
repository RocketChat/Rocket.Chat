import { slashCommands } from '../../../app/utils/client/slashCommand';

slashCommands.add({
	command: 'archive',
	options: {
		description: 'Archive',
		params: '#channel',
		permission: 'archive-room',
	},
	providesPreview: false,
});
