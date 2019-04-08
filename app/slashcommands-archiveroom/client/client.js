import { slashCommands } from '../../utils';

slashCommands.add('archive', null, {
	description: 'Archive',
	params: '#channel',
});
