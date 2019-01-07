import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.slashCommands.add('hide', undefined, {
	description: 'Hide_room',
	params: '#room',
});
