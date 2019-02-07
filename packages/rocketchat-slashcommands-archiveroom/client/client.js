import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.slashCommands.add('archive', null, {
	description: 'Archive',
	params: '#channel',
});
