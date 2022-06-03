import { Meteor } from 'meteor/meteor';

import { LivechatRooms, LivechatCustomField } from '../../../models';
import { LivechatVisitors } from '../../../models/server/raw';

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
