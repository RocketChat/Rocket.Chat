import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import { getUserAvatarURL } from '../../../utils/lib/getUserAvatarURL';

const getUsername = ({ userId, username }) => {
	if (username) {
		return username;
	}

	if (userId) {
		const user = Meteor.users.findOne(userId, { fields: { username: 1 } });
		return user && user.username;
	}
};

Template.avatar.helpers({
	src() {
		const { url } = Template.instance().data;
		if (url) {
			return url;
		}

		let username = getUsername(this);
		if (!username) {
			return;
		}

		Session.get(`avatar_random_${ username }`);

		if (this.roomIcon) {
			username = `@${ username }`;
		}

		return getUserAvatarURL(username);
	},

	alt() {
		return getUsername(this);
	},
});
