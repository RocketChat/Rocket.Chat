import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { hasPermission } from 'meteor/rocketchat:authorization';
import { LivechatTrigger } from 'meteor/rocketchat:models';

Meteor.methods({
	'livechat:saveTrigger'(trigger) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:saveTrigger' });
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
			return LivechatTrigger.updateById(trigger._id, trigger);
		} else {
			return LivechatTrigger.insert(trigger);
		}
	},
});
