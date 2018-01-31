import { RocketChat } from 'meteor/rocketchat:lib';

import { authenticated } from '../../helpers/authenticated';
import schema from '../../schemas/users/setStatus.graphqls';

const resolver = {
	Mutation: {
		setStatus: authenticated((root, { status }, { user }) => {
			RocketChat.models.Users.update(user._id, {
				$set: {
					status: status.toLowerCase()
				}
			});

			return RocketChat.models.Users.findOne(user._id);
		})
	}
};

export {
	schema,
	resolver
};
