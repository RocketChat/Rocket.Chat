import { slashCommands } from '../../utils/lib/slashCommand';

slashCommands.add({
	command: 'create',
	options: {
		description: 'Create_A_New_Channel',
		params: '#channel',
		permission: ['create-c', 'create-p'],
	},
	providesPreview: false,
});
