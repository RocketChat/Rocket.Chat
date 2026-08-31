import { slashCommands } from '../../lib/slashCommand';

slashCommands.add({
	command: 'hide',
	options: {
		description: 'Hide_room',
		params: '#room',
	},
});
