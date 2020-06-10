import { Meteor } from 'meteor/meteor';

import { ScreensharingManager } from '../lib/screenSharing';

Meteor.methods({
	async 'livechat:requestScreenSharing'(roomId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'livechat:requestScreenSharing' });
		}

		const user = Meteor.user();

		ScreensharingManager.requestScreenSharing(roomId, user);
	},
});
