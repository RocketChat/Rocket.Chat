import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../authorization';
import { LivechatTrigger } from '../../../models/server/raw';

Meteor.methods({
	async 'livechat:saveTrigger'(trigger) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:saveTrigger',
			});
		}

		check(trigger, {
			_id: Match.Maybe(String),
			name: String,
			description: String,
			enabled: Boolean,
			runOnce: Boolean,
			conditions: Array,
			actions: Array,
		});

		if (trigger._id) {
			await LivechatTrigger.updateById(trigger._id, trigger);
			return true;
		}
		await LivechatTrigger.insertOne(trigger);

		return true;
	},
});
