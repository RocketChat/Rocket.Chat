import { slashCommands } from 'meteor/rocketchat:utils';

slashCommands.add('archive', null, {
	description: 'Archive',
	params: '#channel',
});
