import { slashCommands } from '../../utils/lib/slashCommand';

slashCommands.add({
	command: 'bridge',
	options: {
		description: 'Invites_an_user_to_a_bridged_room',
		params: '#command #user',
	},
	providesPreview: false,
});
