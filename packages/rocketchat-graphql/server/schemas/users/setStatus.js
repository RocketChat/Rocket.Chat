import { authenticated } from '../../helpers/authenticated';

export const schema = `
	type Mutation {
		setStatus(status: UserStatus!): User
	}
`;

export const resolver = {
	Mutation: {
		setStatus: authenticated((root, { status }, { models, user }) => {
			models.Users.update(user._id, {
				$set: {
					status: status.toLowerCase()
				}
			});

			return models.Users.findOne(user._id);
		})
	}
};
