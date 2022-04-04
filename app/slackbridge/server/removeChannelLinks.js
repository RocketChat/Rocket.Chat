import { Meteor } from 'meteor/meteor';

import { Rooms } from '../../models/server';
import { hasPermission } from '../../authorization/server';
import { settings } from '../../settings/server';

Meteor.methods({
	removeSlackBridgeChannelLinks() {
		const user = Meteor.user();
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeSlackBridgeChannelLinks',
			});
		}

		if (!hasPermission(user._id, 'remove-slackbridge-links')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'removeSlackBridgeChannelLinks',
			});
		}

		if (settings.get('SlackBridge_Enabled') !== true) {
			throw new Meteor.Error('SlackBridge_disabled');
		}

		Rooms.unsetAllImportIds();

		return {
			message: 'Slackbridge_channel_links_removed_successfully',
			params: [],
		};
	},
});
