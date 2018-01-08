Meteor.methods({
	listCustomUserStatus() {
		return RocketChat.models.CustomUserStatus.find({}).fetch();
	}
});
