import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.slashCommands.add('create', null, {
	description: 'Create_A_New_Channel',
	params: '#channel',
});
