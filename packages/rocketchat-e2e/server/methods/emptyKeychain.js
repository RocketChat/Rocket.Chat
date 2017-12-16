Meteor.methods({
	emptyKeychain() {
		return RocketChat.models.Users.emptyKeychain();
	}
});
