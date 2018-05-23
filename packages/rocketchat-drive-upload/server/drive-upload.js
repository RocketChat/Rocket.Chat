Meteor.methods({
	uploadFileToDrive(file) {
		const app  = RocketChat.models.OAuthApps.find({"name": "google"});
		console.log(app);
	}
});

