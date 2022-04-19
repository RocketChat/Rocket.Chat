import { slashCommands } from '../../utils/lib/slashCommand';

slashCommands.add(
	'create',
	undefined,
	{
		description: 'Create_A_New_Channel',
		params: '#channel',
		permission: ['create-c', 'create-p'],
	},
	undefined,
	false,
	undefined,
	undefined,
);
