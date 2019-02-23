import { slashCommands } from 'meteor/rocketchat:utils';

slashCommands.add('unarchive', null, {
	description: 'Unarchive',
	params: '#channel',
});
