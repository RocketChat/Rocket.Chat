import { slashCommands } from '../../utils/lib/slashCommand';

slashCommands.add(
	'unarchive',
	undefined,
	{
		description: 'Unarchive',
		params: '#channel',
		permission: 'unarchive-room',
	},
	undefined,
	false,
	undefined,
	undefined,
);
