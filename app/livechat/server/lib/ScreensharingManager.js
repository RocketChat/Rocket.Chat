import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';
import { Messages } from '../../../models/server';

export const ScreensharingManager = {
	enabled() {
		return settings.get('Livechat_screenshare_enabled');
	},

	requestScreenshareAccess(roomId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized');
		}

		const user = Meteor.user();

		Messages.createWithTypeRoomIdMessageAndUser('request_screenshare_access', roomId, '', user);
	},
};
