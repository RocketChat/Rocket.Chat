import { Meteor } from 'meteor/meteor';
// import { TAPi18n } from 'meteor/tap:i18n';
import { MessageTypes } from '../../../../ui-utils';

Meteor.startup(function() {
	MessageTypes.registerType({
		id: 'discussion-created',
		system: false,
		message: 'discussion-created',
		data(message) {
			return {
				// channelLink: `<a class="mention-link" data-channel= ${ message.channels[0]._id }  title="">${ TAPi18n.__('discussion') }</a>`,
				message: `<svg class="rc-icon" aria-hidden="true"><use xlink:href="#icon-discussion"></use></svg> ${ message.msg }`,
			};
		},
	});
});
