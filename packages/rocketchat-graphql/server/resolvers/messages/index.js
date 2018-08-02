import { mergeTypes, mergeResolvers } from 'merge-graphql-schemas';

// queries
import * as messages from './messages';
// mutations
import * as sendMessage from './sendMessage';
import * as editMessage from './editMessage';
import * as deleteMessage from './deleteMessage';
import * as addReactionToMessage from './addReactionToMessage';
// subscriptions
import * as chatMessageAdded from './chatMessageAdded';
// types
import * as MessageType from './Message-type';
import * as MessagesWithCursorType from './MessagesWithCursor-type';
import * as MessageIdentifier from './MessageIdentifier-input';
import * as ReactionType from './Reaction-type';

export const schema = mergeTypes([
	// queries
	messages.schema,
	// mutations
	sendMessage.schema,
	editMessage.schema,
	deleteMessage.schema,
	addReactionToMessage.schema,
	// subscriptions
	chatMessageAdded.schema,
	// types
	MessageType.schema,
	MessagesWithCursorType.schema,
	MessageIdentifier.schema,
	ReactionType.schema
]);

export const resolvers = mergeResolvers([
	// queries
	messages.resolver,
	// mutations
	sendMessage.resolver,
	editMessage.resolver,
	deleteMessage.resolver,
	addReactionToMessage.resolver,
	// subscriptions
	chatMessageAdded.resolver,
	// types
	MessageType.resolver
]);
