import { slashCommands } from '/app/utils';

slashCommands.add('archive', null, {
	description: 'Archive',
	params: '#channel',
});
