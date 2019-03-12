import { slashCommands } from '/app/utils';

slashCommands.add('hide', undefined, {
	description: 'Hide_room',
	params: '#room',
});
