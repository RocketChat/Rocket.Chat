import {RocketChat} from 'meteor/rocketchat:lib';

Meteor.startup(function() {
	RocketChat.MessageTypes.registerType({
		id: 'create-thread',
		system: true,
		message: 'thread-created',
		data(message) {
			return {
				channelLink: `<a class="mention-link" data-channel= ${ message.channels[0]._id }  title="">${ TAPi18n.__('thread') }</a>`,
				message: `<a class="mention-link" data-channel= ${ message.channels[0]._id }  title="">&quot;${ message.channels[0].initialMessage.text }&quot;</a>`,
				username: `<a class="mention-link" data-username= ${ message.mentions[0].name } title="">@${ message.mentions[0].name }</a>`
			};
		}
	});

	RocketChat.MessageTypes.registerType({
		id: 'thread-welcome',
		system: true,
		message: 'thread-welcome',
		data(message) {
			return {
				parentChannel: `<a class="mention-link" data-channel= ${ message.channels[0]._id }  title="">${ message.channels[0].name }</a>`,
				username: `<a class="mention-link" data-username= ${ message.mentions[0].name } title="">@${ message.mentions[0].name }</a>`
			};
		}
	});
});

