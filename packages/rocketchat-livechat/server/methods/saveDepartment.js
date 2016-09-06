/* eslint new-cap: [2, {"capIsNewExceptions": ["Match.ObjectIncluding", "Match.Optional"]}] */

Meteor.methods({
	'livechat:saveDepartment'(_id, departmentData, departmentAgents) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:saveDepartment' });
		}

		if (_id) {
			check(_id, String);
		}

		check(departmentData, Match.ObjectIncluding({ enabled: Boolean, name: String, description: Match.Optional(String), agents: Match.Optional([Match.ObjectIncluding({ _id: String, username: String })]) }));

		if (_id) {
			const department = RocketChat.models.LivechatDepartment.findOneById(_id);
			if (!department) {
				throw new Meteor.Error('error-department-not-found', 'Department not found', { method: 'livechat:saveDepartment' });
			}
		}

		return RocketChat.models.LivechatDepartment.createOrUpdateDepartment(_id, departmentData.enabled, departmentData.name, departmentData.description, departmentAgents);
	}
});
