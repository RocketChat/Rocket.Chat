import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/tap:i18n';
import { MessageTypes } from 'meteor/rocketchat:ui-utils';

Meteor.startup(function() {
	MessageTypes.registerType({
		id: 'create-thread',
		system: true,
		message: 'thread-created',
		data(message) {
			return {
				channelLink: `<a class="mention-link" data-channel= ${ message.channels[0]._id }  title="">${ TAPi18n.__('thread') }</a>`,
				message: `<a class="mention-link" data-channel= ${ message.channels[0]._id }  title="">&quot;${ message.channels[0].initialMessage.text }&quot;</a>`,
				username: `<a class="mention-link" data-username= ${ message.mentions[0].name } title="">@${ message.mentions[0].name }</a>`,
			};
		},
	});

	MessageTypes.registerType({
		id: 'thread-welcome',
		system: true,
		message: 'thread-welcome',
		data(message) {
			const threadChannelName = message.channels[0].name || TAPi18n.__('a_direct_message');

			return {
				parentChannel: `<a class="mention-link" data-channel= ${ message.channels[0]._id }  title="">${ threadChannelName }</a>`,
				username: `<a class="mention-link" data-username= ${ message.mentions[0].name } title="">@${ message.mentions[0].name }</a>`,
			};
		},
	});
});
