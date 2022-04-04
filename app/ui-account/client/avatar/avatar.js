import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Rooms } from '../../../models/client';
import { getRoomAvatarURL } from '../../../utils/lib/getRoomAvatarURL';
import { getUserAvatarURL } from '../../../utils/lib/getUserAvatarURL';

const getUsername = ({ userId, username }) => {
	const query = {};
	if (username) {
		query.username = username;
	}

	if (userId) {
		query._id = userId;
	}

	const user = Meteor.users.findOne(query, { fields: { username: 1, avatarETag: 1 } });
	if (!user) {
		return {};
	}

	return user;
};

const getRoomETag = (rid) => Rooms.findOne({ _id: rid }, { fields: { avatarETag: 1 } });

Template.avatar.helpers({
	src() {
		const { url, rid } = Template.instance().data;
		if (url) {
			return url;
		}

		if (rid) {
			const { avatarETag } = getRoomETag(rid) || {};
			return getRoomAvatarURL(rid, avatarETag);
		}

		if (this.roomIcon && this.username) {
			return getUserAvatarURL(`@${this.username}`);
		}

		const { username, avatarETag } = getUsername(this);
		if (!username) {
			if (this.username) {
				return getUserAvatarURL(this.username);
			}
			return;
		}

		return getUserAvatarURL(username, avatarETag);
	},

	alt() {
		const { username } = getUsername(this);
		return username;
	},
});
