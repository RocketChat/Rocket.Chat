Meteor.methods({
	removeGuestUser(user) {
		if (user.guestId) {
			// Just in case of data manipulation
			let userCheck = RocketChat.models.Users.find({_id: user._id, guestId: user.guestId});
			if (userCheck) {
				RocketChat.models.Users.remove(user._id);
			}
		}
	}
});
