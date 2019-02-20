import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Rooms } from 'meteor/rocketchat:models';
import { hasPermission } from 'meteor/rocketchat:authorization';

Meteor.methods({
	'getParentChannelList'({ sort, limit }) {
		this.unblock();
		check(sort, Match.Optional(String));
		check(limit, Match.Optional(Number));

		if (!Meteor.userId()) {
			return { channels: [] };
		}

		const options = {
			fields: {
				name: 1,
				usersCount: 1,
				default: 1,
				msgs: 1,
				t: 1,
			},
			sort: {
				msgs: -1,
			},
		};

		if (Number.isInteger(limit)) {
			options.limit = limit;
		}

		if (sort.trim) {
			switch (sort) {
				case 'name':
					options.sort = {
						name: 1,
					};
					break;
				case 'msgs':
					options.sort = {
						msgs: -1,
					};
					break;
				case 'members':
					options.sort = {
						usersCount: -1,
					};
					break;
			}
		}

		const roomTypes = ['c'];
		if (hasPermission(this.userId, 'view-other-user-channels')) {
			roomTypes.push('p');
		}

		return {
			channels: Rooms.findThreadParentByNameStarting('', options).fetch(),
		};
	},
});
