import { slashCommands } from '/app/utils';

slashCommands.add('create', null, {
	description: 'Create_A_New_Channel',
	params: '#channel',
});
