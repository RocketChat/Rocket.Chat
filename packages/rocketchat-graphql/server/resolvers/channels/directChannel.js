import { RocketChat } from 'meteor/rocketchat:lib';

import { authenticated } from '../../helpers/authenticated';
import { roomPublicFields } from './settings';
import schema from '../../schemas/channels/directChannel.graphqls';

const resolver = {
	Query: {
		directChannel: authenticated((root, { username, channelId }, { user }) => {
			const query = {
				t: 'd',
				usernames: user.username
			};

			if (typeof username !== 'undefined') {
				if (username === user.username) {
					throw new Error('You cannot specify your username');
				}

				query.usernames = { $all: [ user.username, username ] };
			} else if (typeof channelId !== 'undefined') {
				query.id = channelId;
			} else {
				throw new Error('Use one of those fields: username, channelId');
			}

			return RocketChat.models.Rooms.findOne(query, {
				fields: roomPublicFields
			});
		})
	}
};

export {
	schema,
	resolver
};
