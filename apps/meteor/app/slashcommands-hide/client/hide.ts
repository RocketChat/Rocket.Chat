import { slashCommands } from '../../utils/lib/slashCommand';

slashCommands.add({
	command: 'hide',
	options: {
		description: 'Hide_room',
		params: '#room',
	},
});
