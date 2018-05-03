RocketChat.Migrations.add({
	version: 72,
	up() {
		RocketChat.models.Users.find({ type: 'visitor', 'emails.address': { $exists: true } }, { emails: 1 }).forEach(function(visitor) {
			RocketChat.models.Users.update({ _id: visitor._id }, {
				$set: {
					visitorEmails: visitor.emails
				},
				$unset: {
					emails: 1
				}
			});
		});
	}
});
