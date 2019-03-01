import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/tap:i18n';
import { MessageTypes } from 'meteor/rocketchat:ui-utils';

Meteor.startup(function() {
	MessageTypes.registerType({
		id: 'jitsi_call_rejected',
		system: true,
		message: TAPi18n.__('Rejected_a_video_call'),
	});
	MessageTypes.registerType({
		id: 'jitsi_call_finished_creator',
		system: true,
		message: TAPi18n.__('Finished_a_video_call_creator'),
	});
});
