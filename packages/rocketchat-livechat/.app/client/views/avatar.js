import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import visitor from '../../imports/client/visitor';

Template.avatar.helpers({
	imageUrl() {
		let { username } = this;
		if (!username && this.userId) {
			const user = Meteor.users.findOne(this.userId, { fields: { username: 1 } });
			username = user && user.username;
		}

		const currentUser = visitor.getData();
		if (!username || (currentUser && currentUser.username === username)) {
			return;
		}

		Session.get(`avatar_random_${ username }`);

		return `background-image:url(${ getAvatarUrlFromUsername(username) });`;
	},
});
