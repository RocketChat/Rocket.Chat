import { slashCommands } from 'meteor/rocketchat:utils';

slashCommands.add('create', null, {
	description: 'Create_A_New_Channel',
	params: '#channel',
});
