import { RocketChat } from 'meteor/rocketchat:lib';

import { authenticated } from '../../helpers/authenticated';
import schema from '../../schemas/channels/createChannel.graphqls';

const resolver = {
	Mutation: {
		createChannel: authenticated((root, args, { user }) => {
			try {
				RocketChat.API.channels.create.validate({
					user: {
						value: user._id
					},
					name: {
						value: args.name,
						key: 'name'
					},
					members: {
						value: args.membersId,
						key: 'membersId'
					}
				});
			} catch (e) {
				throw e;
			}

			const { channel } = RocketChat.API.channels.create.execute(user._id, {
				name: args.name,
				members: args.membersId
			});

			return channel;
		})
	}
};

export {
	schema,
	resolver
};
