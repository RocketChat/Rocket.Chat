Meteor.methods({
	'livechat:getCustomFields'() {
		return RocketChat.models.LivechatCustomField.find().fetch();
	}
});
