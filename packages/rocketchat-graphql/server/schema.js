import {
	makeExecutableSchema
} from 'graphql-tools';

import { mergeTypes, mergeResolvers } from 'merge-graphql-schemas';

import * as channels from './schemas/channels';
import * as messages from './schemas/messages';
import * as accounts from './schemas/accounts';
import * as users from './schemas/users';

const schema = mergeTypes([
	channels.schema,
	messages.schema,
	accounts.schema,
	users.schema
]);

const resolvers = mergeResolvers([
	channels.resolvers,
	messages.resolvers,
	accounts.resolvers,
	users.resolvers
]);

export const executableSchema = makeExecutableSchema({
	typeDefs: [schema],
	resolvers,
	logger: {
		log: (e) => console.log(e)
	}
});
