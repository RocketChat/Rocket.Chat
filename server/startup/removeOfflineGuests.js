Meteor.startup(() => {
	const query = {
		username: {$exists: 1},
		status: {$in: ['online', 'away', 'busy']}
	};
	RocketChat.models.Users.find(query).observeChanges({
		removed: id => {
			const user = RocketChat.models.Users.findOne({_id: id});
			if (user && user.guestId) {
				RocketChat.models.Users.remove(id);
			}
		}
	});
});
