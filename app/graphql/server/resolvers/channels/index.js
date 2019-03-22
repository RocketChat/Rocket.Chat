import { mergeTypes, mergeResolvers } from 'merge-graphql-schemas';

// queries
import * as channels from './channels';
import * as channelByName from './channelByName';
import * as directChannel from './directChannel';
import * as channelsByUser from './channelsByUser';
// mutations
import * as createChannel from './createChannel';
import * as leaveChannel from './leaveChannel';
import * as hideChannel from './hideChannel';
import * as deleteChannel from './deleteChannel';
// types
import * as ChannelType from './Channel-type';
import * as ChannelSort from './ChannelSort-enum';
import * as ChannelFilter from './ChannelFilter-input';
import * as Privacy from './Privacy-enum';
import * as ChannelNameAndDirect from './ChannelNameAndDirect-input';

export const schema = mergeTypes([
	// queries
	channels.schema,
	channelByName.schema,
	directChannel.schema,
	channelsByUser.schema,
	// mutations
	createChannel.schema,
	leaveChannel.schema,
	hideChannel.schema,
	deleteChannel.schema,
	// types
	ChannelType.schema,
	ChannelSort.schema,
	ChannelFilter.schema,
	Privacy.schema,
	ChannelNameAndDirect.schema,
]);

export const resolvers = mergeResolvers([
	// queries
	channels.resolver,
	channelByName.resolver,
	directChannel.resolver,
	channelsByUser.resolver,
	// mutations
	createChannel.resolver,
	leaveChannel.resolver,
	hideChannel.resolver,
	deleteChannel.resolver,
	// types
	ChannelType.resolver,
]);
