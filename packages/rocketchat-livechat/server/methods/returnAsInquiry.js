Meteor.methods({
	'livechat:returnAsInquiry'(rid, departmentId) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:saveDepartment' });
		}

		return RocketChat.Livechat.returnRoomAsInquiry(rid, departmentId);
	}
});
