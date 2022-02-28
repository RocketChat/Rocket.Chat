import { Meteor } from 'meteor/meteor';

import { jitsiSlashCommandsCount } from '../../../videobridge/server/methods/jitsiStats';

Meteor.methods({
	slashCommandsStats(command) {
		if (command === 'jitsi') {
			jitsiSlashCommandsCount();
		}
	},
});
