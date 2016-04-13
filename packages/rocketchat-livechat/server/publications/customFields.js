Meteor.publish('livechat:customFields', function(_id) {
	if (!this.userId) {
		throw new Meteor.Error('not-authorized');
	}

	if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
		throw new Meteor.Error('not-authorized');
	}

	if (s.trim(_id)) {
		return RocketChat.models.LivechatCustomField.find({ _id: _id });
	}

	return RocketChat.models.LivechatCustomField.find();

});
