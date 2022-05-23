import { slashCommands } from '../../utils/lib/slashCommand';

slashCommands.add('hide', undefined, {
	description: 'Hide_room',
	params: '#room',
});
