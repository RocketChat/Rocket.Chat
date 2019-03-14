import { slashCommands } from '/app/utils';

slashCommands.add('unarchive', null, {
	description: 'Unarchive',
	params: '#channel',
});
