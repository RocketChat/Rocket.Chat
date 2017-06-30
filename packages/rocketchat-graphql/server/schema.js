import {
	makeExecutableSchema
} from 'graphql-tools';

import { mergeTypes, mergeResolvers } from 'merge-graphql-schemas';

import { authenticated } from './mocks/accounts/graphql-api';

import AccountsServer from './mocks/accounts/server';

import {
	property
} from './helpers/property';

import * as channels from './schemas/channels';
import * as messages from './schemas/messages';

const rootSchema = `
	type Mutation {
		setStatus(status: UserStatus!): Member
	}

	enum UserStatus {
		ONLINE
		AWAY
		BUSY
		INVISIBLE
	}

	type Member {
		id: String!
		name: String
		# TODO: change to UserStatus
		status: String
	}
`;

const rootResolvers = {
	Mutation: {
		setStatus: authenticated(AccountsServer, (root, { status }, { models, user }) => {
			models.Users.update(user._id, {
				$set: {
					status: status.toLowerCase()
				}
			});

			return models.Users.findOne(user._id);
		})
	},
	Member: {
		id: property('_id'),
		status: ({status}) => status.toUpperCase()
	}
};

const schema = mergeTypes([
	rootSchema,
	channels.schema,
	messages.schema
]);

const resolvers = mergeResolvers([
	rootResolvers,
	channels.resolvers,
	messages.resolvers
]);

export const executableSchema = makeExecutableSchema({
	typeDefs: [schema],
	resolvers,
	logger: {
		log: (e) => console.log(e)
	}
});
