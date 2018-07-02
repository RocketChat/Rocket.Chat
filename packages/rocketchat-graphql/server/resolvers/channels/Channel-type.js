import { RocketChat } from 'meteor/rocketchat:lib';
import property from 'lodash.property';

import schema from '../../schemas/channels/Channel-type.graphqls';

const resolver = {
	Channel: {
		id: property('_id'),
		name: (root, args, { user }) => {
			if (root.t === 'd') {
				return root.usernames.find(u => u !== user.username);
			}

			return root.name;
		},
		members: (root) => {
			const ids = RocketChat.models.Subscriptions.find({ rid: root._id, 'u._id': { $exists: 1 } }, { fields: { u: 1 } }).fetch();
			return RocketChat.models.Users.find({ _id: { $in: ids } }).fetch();
		},
		owners: (root) => {
			// there might be no owner
			if (!root.u) {
				return;
			}

			return [RocketChat.models.Users.findOneByUsername(root.u.username)];
		},
		numberOfMembers: (root) => {
			return RocketChat.models.Subscriptions.findByRoomId(root._id).count();
		},
		numberOfMessages: property('msgs'),
		readOnly: (root) => root.ro === true,
		direct: (root) => root.t === 'd',
		privateChannel: (root) => root.t === 'p',
		favourite: (root, args, { user }) => {
			const room = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(root._id, user._id);

			return room && room.f === true;
		},
		unseenMessages: (root, args, { user }) => {
			const room = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(root._id, user._id);

			return (room || {}).unread;
		}
	}
};

export {
	schema,
	resolver
};
