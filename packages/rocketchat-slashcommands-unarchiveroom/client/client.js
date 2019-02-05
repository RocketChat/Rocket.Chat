import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.slashCommands.add('unarchive', null, {
	description: 'Unarchive',
	params: '#channel',
});
