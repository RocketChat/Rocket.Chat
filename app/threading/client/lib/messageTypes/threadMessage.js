import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/tap:i18n';
import { MessageTypes } from '../../../../ui-utils';

Meteor.startup(function() {
	// MessageTypes.registerType({
	// 	id: 'thread-created',
	// 	system: true,
	// 	message: 'thread-created',
	// 	data(message) {
	// 		return {
	// 			// channelLink: `<a class="mention-link" data-channel= ${ message.channels[0]._id }  title="">${ TAPi18n.__('thread') }</a>`,
	// 			message: message.msg,
	// 			username: `<a class="mention-link" data-username=${ message.u.username } title="">@${ message.u.username }</a>`,
	// 		};
	// 	},
	// });
});
