import { mergeTypes, mergeResolvers } from 'merge-graphql-schemas';

// mutations
import * as setStatus from './setStatus';
// types
import * as UserType from './User-type';
import * as UserStatus from './UserStatus-enum';

export const schema = mergeTypes([
	// mutations
	setStatus.schema,
	// types
	UserType.schema,
	UserStatus.schema
]);

export const resolvers = mergeResolvers([
	// mutations
	setStatus.resolver,
	// types
	UserType.resolver
]);
