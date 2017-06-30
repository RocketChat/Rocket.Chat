import { mergeTypes, mergeResolvers } from 'merge-graphql-schemas';

// queries
import * as channels from './channels';
import * as channelByName from './channelByName';
import * as channelsByUser from './channelsByUser';
// mutations
import * as createChannel from './createChannel';
// types
import * as channelType from './Channel-type';
import * as channelSort from './ChannelSort-enum';
import * as channelFilter from './ChannelFilter-input';
import * as Privacy from './Privacy-enum';

export const schema = mergeTypes([
	// queries
	channels.schema,
	channelByName.schema,
	channelsByUser.schema,
	// mutations
	createChannel.schema,
	// types
	channelType.schema,
	channelSort.schema,
	channelFilter.schema,
	Privacy.schema
]);

export const resolvers = mergeResolvers([
	// queries
	channels.resolver,
	channelByName.resolver,
	channelsByUser.resolver,
	// mutations
	createChannel.resolver,
	// types
	channelType.resolver
]);
