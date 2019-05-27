import { Users } from '../../../../models';

import { authenticated } from '../../helpers/authenticated';
import schema from '../../schemas/users/setStatus.graphqls';

const resolver = {
	Mutation: {
		setStatus: authenticated((root, { status }, { user }) => {
			Users.update(user._id, {
				$set: {
					status: status.toLowerCase(),
				},
			});

			return Users.findOne(user._id);
		}),
	},
};

export {
	schema,
	resolver,
};
