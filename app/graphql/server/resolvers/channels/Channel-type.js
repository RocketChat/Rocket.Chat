import { Subscriptions, Users } from '../../../../models';
import property from 'lodash.property';

import schema from '../../schemas/channels/Channel-type.graphqls';

const resolver = {
	Channel: {
		id: property('_id'),
		name: (root, args, { user }) => {
			if (root.t === 'd') {
				return root.usernames.find((u) => u !== user.username);
			}

			return root.name;
		},
		members: (root) => {
			const ids = Subscriptions.findByRoomIdWhenUserIdExists(root._id, { fields: { 'u._id': 1 } })
				.fetch()
				.map((sub) => sub.u._id);
			return Users.findByIds(ids).fetch();
		},
		owners: (root) => {
			// there might be no owner
			if (!root.u) {
				return;
			}

			return [Users.findOneByUsername(root.u.username)];
		},
		numberOfMembers: (root) => Subscriptions.findByRoomId(root._id).count(),
		numberOfMessages: property('msgs'),
		readOnly: (root) => root.ro === true,
		direct: (root) => root.t === 'd',
		privateChannel: (root) => root.t === 'p',
		favourite: (root, args, { user }) => {
			const room = Subscriptions.findOneByRoomIdAndUserId(root._id, user._id);

			return room && room.f === true;
		},
		unseenMessages: (root, args, { user }) => {
			const room = Subscriptions.findOneByRoomIdAndUserId(root._id, user._id);

			return (room || {}).unread;
		},
	},
};

export {
	schema,
	resolver,
};
