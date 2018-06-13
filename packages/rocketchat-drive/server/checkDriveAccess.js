Meteor.methods({
	checkDriveAccess() {
		const id = Meteor.userId();
		const driveScope = 'https://www.googleapis.com/auth/drive';
		const user = RocketChat.models.Users.findOne({_id: id});

		if (!user || !user.services.google) {
			return false;
		}

		const token = user.services.google.accessToken;
		const scopes = user.services.google.scope;

		if (!token || !scopes || scopes.indexOf(driveScope) === -1) {
			return false;
		}

		return true;
	}
});
