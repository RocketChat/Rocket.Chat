Meteor.methods({
	serverHasAdminUser() {
		return Boolean(Meteor.users.find({roles: 'admin'}).count());
	}
});
