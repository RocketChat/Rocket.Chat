Meteor.methods({
	'livechat:saveTrigger'(trigger) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:saveTrigger' });
		}

		check(trigger, {
			_id: Match.Maybe(String),
			name: String,
			description: String,
			enabled: Boolean,
			conditions: Array,
			actions: Array
		});

		if (trigger._id) {
			return RocketChat.models.LivechatTrigger.updateById(trigger._id, trigger);
		} else {
			return RocketChat.models.LivechatTrigger.insert(trigger);
		}
	}
});
