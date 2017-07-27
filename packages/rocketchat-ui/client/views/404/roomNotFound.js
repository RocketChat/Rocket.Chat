Template.roomNotFound.helpers({
	data() {
		return Session.get('roomNotFound');
	},
	name() {
		return Blaze._escape(this.name);
	},
	sameUser() {
		const user = Meteor.user();
		return user && user.username === this.name;
	}
});
