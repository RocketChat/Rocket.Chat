import { Meteor } from 'meteor/meteor';
import { LivechatVisitors } from '@rocket.chat/models';

import { LivechatRooms, LivechatCustomField } from '../../../models/server';

Meteor.methods({
	async 'livechat:setCustomField'(token, key, value, overwrite = true) {
		const customField = LivechatCustomField.findOneById(key);
		if (customField) {
			if (customField.scope === 'room') {
				return LivechatRooms.updateDataByToken(token, key, value, overwrite);
			}
			// Save in user
			return LivechatVisitors.updateLivechatDataByToken(token, key, value, overwrite);
		}

		return true;
	},
});
