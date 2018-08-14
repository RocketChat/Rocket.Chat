import { makeExecutableSchema } from 'graphql-tools';
import { mergeTypes, mergeResolvers } from 'merge-graphql-schemas';

import * as channels from './resolvers/channels';
import * as messages from './resolvers/messages';
import * as accounts from './resolvers/accounts';
import * as users from './resolvers/users';

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
