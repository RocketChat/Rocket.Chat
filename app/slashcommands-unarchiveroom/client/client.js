import { slashCommands } from '../../utils';

slashCommands.add('unarchive', null, {
	description: 'Unarchive',
	params: '#channel',
});
