import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { getUserAvatarURL } from '../../../utils/lib/getUserAvatarURL';

Template.avatar.helpers({
	src() {
		let { url } = Template.instance().data;
		if (!url) {
			let { username } = this;
			if (username == null && this.userId != null) {
				const user = Meteor.users.findOne(this.userId);
				username = user && user.username;
			}
			if (username == null) {
				return;
			}
			Session.get(`avatar_random_${ username }`);

			if (this.roomIcon) {
				username = `@${ username }`;
			}

			url = getUserAvatarURL(username);
		}
		return url;
	},
});
