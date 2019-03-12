import { slashCommands } from 'meteor/rocketchat:utils';

slashCommands.add('hide', undefined, {
	description: 'Hide_room',
	params: '#room',
});
