Template.avatar.helpers({
	imageUrl() {
		let username = this.username;
		if (username == null && this.userId != null) {
			const user = Meteor.users.findOne(this.userId);
			username = user && user.username;
		}
		if (username == null) {
			return;
		}
		Session.get(`avatar_random_${ username }`);
		const url = getAvatarUrlFromUsername(username);
		return `background-image:url(${ url });`;
	}
});
