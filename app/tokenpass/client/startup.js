import { Meteor } from 'meteor/meteor';

import { ChannelSettings } from '../../channel-settings';
import { Rooms } from '../../models';

Meteor.startup(function () {
	ChannelSettings.addOption({
		group: ['room'],
		id: 'tokenpass',
		template: 'channelSettings__tokenpass',
		validation(data) {
			if (data && data.rid) {
				const room = Rooms.findOne(data.rid, { fields: { tokenpass: 1 } });

				return room && room.tokenpass;
			}

			return false;
		},
	});
});
