import { Meteor } from 'meteor/meteor';

import { authenticated } from '../../helpers/authenticated';

export const schema = `
	type Mutation {
		createChannel(
			name: String!,
			private: Boolean = false,
			readOnly: Boolean = false,
			membersId: [String!]
		): Channel
	}
`;

export const resolver = {
	Mutation: {
		createChannel: authenticated((root, args, { models, user }) => {
			if (!RocketChat.authz.hasPermission(user._id, 'create-c')) {
				return RocketChat.API.v1.unauthorized();
			}

			if (!args.name) {
				throw new Error('Param "name" is required');
			}

			if (args.membersId && !_.isArray(args.membersId)) {
				throw new Error('Param "membersId" must be an array if provided');
			}

			let readOnly = false;
			if (typeof args.readOnly !== 'undefined') {
				readOnly = args.readOnly;
			}

			let id;
			Meteor.runAsUser(user._id, () => {
				id = Meteor.call('createChannel', args.name, args.membersId ? args.membersId : [], readOnly);
			});

			return models.Rooms.findOneById(id.rid, { fields: RocketChat.API.v1.defaultFieldsToExclude });
		})
	}
};

