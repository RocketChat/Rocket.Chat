import visitor from '../../imports/client/visitor';

Template.avatar.helpers({
	imageUrl() {
		let username = this.username;
		if (!username && this.userId) {
			const user = Meteor.users.findOne(this.userId, { fields: { username: 1 }});
			username = user && user.username;
		}

		const currentUser = visitor.getData();
		if (!username || (currentUser && currentUser.username === username)) {
			return;
		}

		Session.get(`avatar_random_${ username }`);

		return `background-image:url(${ getAvatarUrlFromUsername(username) });`;
	}
});
