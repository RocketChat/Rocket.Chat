Meteor.publish('livechat:trigger', function() {
	return RocketChat.models.LivechatTrigger.find();
});
