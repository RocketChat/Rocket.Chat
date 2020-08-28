import { Meteor } from 'meteor/meteor';

import { MessageTypes } from '../../ui-utils';

Meteor.startup(function() {
	MessageTypes.registerType({
		id: 'jitsi_call_started',
		system: true,
		message: 'Started_a_video_call',
	});
});
