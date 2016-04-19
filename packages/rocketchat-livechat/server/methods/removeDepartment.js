Meteor.methods({
	'livechat:removeDepartment'(_id) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('not-authorized');
		}

		check(_id, String);

		var department = RocketChat.models.LivechatDepartment.findOneById(_id, { fields: { _id: 1 } });

		if (!department) {
			throw new Meteor.Error('department-not-found', 'Department_not_found');
		}

		return RocketChat.models.LivechatDepartment.removeById(_id);
	}
});
