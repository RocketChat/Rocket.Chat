import { slashCommands } from '../../utils/lib/slashCommand';

slashCommands.add(
	'bridge',
	undefined,
	{
		description: 'Invites_an_user_to_a_bridged_room',
		params: '#command #user',
	},
	undefined,
	false,
	undefined,
	undefined,
);
