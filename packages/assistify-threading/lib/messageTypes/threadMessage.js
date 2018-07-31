import {RocketChat} from 'meteor/rocketchat:lib';

Meteor.startup(function() {
	RocketChat.MessageTypes.registerType({
		id: 'create-thread',
		system: true,
		message: 'thread-created',
		data(message) {
			return {
				message: `<a class="mention-link" data-channel= ${ message.channels[0].name }  title="">Message</a>`,
				username: `<a class="mention-link" data-username= ${ message.mentions[0].name } title="">@${ message.mentions[0].name }</a>`
			};
		}
	});
});

