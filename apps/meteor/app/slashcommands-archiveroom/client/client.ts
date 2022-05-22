import { slashCommands } from '../../utils/lib/slashCommand';

slashCommands.add(
	'archive',
	undefined,
	{
		description: 'Archive',
		params: '#channel',
		permission: 'archive-room',
	},
	undefined,
	false,
	undefined,
	undefined,
);
