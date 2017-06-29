/* global processWebhookMessage */

import {
	makeExecutableSchema
} from 'graphql-tools';

import { authenticated } from './mocks/accounts/graphql-api';
import AccountsServer from './mocks/accounts/server';

import {
	property
} from './helpers/property';

import {
	findChannelByIdAndUser
} from './helpers/findChannelByIdAndUser';


const schema = `
	type schema {
		query: Query
		mutation: Mutation
	}

	type Query {
		channels(filter: ChannelFilter = {
			privacy: ALL,
			joinedChannels: false,
			sortBy: NAME
		}): [Channel]
		channelByName(name: String!, isDirect: Boolean!): Channel
		channelsByUser(userId: String!): [Channel]
		messages(channelId: String): MessagesWithCursor
	}

	type Mutation {
		sendMessage(channelId: String!, content: String!): Message
	}

	type Channel {
 		id: String!
		name: String
		description: String
		announcement: String
		topic: String
		members: [Member]
		owners: [Member]
		numberOfMembers: Int
		numberOfMessages: Int
		readOnly: Boolean
		direct: Boolean
		privateChannel: Boolean
		favourite: Boolean
		unseenMessages: Int
	}

	enum Privacy {
    PRIVATE
		PUBLIC
		ALL
	}

	enum ChannelSort {
		NAME
		NUMBER_OF_MESSAGES
	}

	input ChannelFilter {
		nameFilter: String
		privacy: Privacy
		joinedChannels: Boolean
		sortBy: ChannelSort
	}

	type Member {
		id: String!
		name: String
	}

	type MessagesWithCursor {
		cursor: String
		channel: Channel
		messagesArray: [Message]
	}

	type Message {
		id: String
		author: Member
		content: String
		creationTime: String
		fromServer: Boolean
		userRef: [Member]
		channelRef: [Channel]
		reactions: [Reaction]
		# TODO
		tags: [String]
	}

	type Reaction {
		username: String
		icon: String
	}
`;

const roomPublicFields = {
	t: 1,
	name: 1,
	description: 1,
	announcement: 1,
	topic: 1,
	usernames: 1,
	msgs: 1,
	ro: 1,
	u: 1,
	archived: 1
};

const resolvers = {
	Query: {
		channels: authenticated(AccountsServer, (root, args, { models }) => {
			const query = {};
			const options = {
				sort: {
					name: 1
				},
				fields: roomPublicFields
			};

			// Filter
			if (typeof args.filter !== 'undefined') {
				// sortBy
				if (args.filter.sortBy === 'NUMBER_OF_MESSAGES') {
					options.sort = {
						msgs: -1
					};
				}

				// privacy
				switch (args.filter.privacy) {
					case 'PRIVATE':
						query.t = 'p';
						break;
					case 'PUBLIC':
						query.t = {
							$ne: 'p'
						};
						break;
				}
			}

			return models.Rooms.find(query, options).fetch();
		}),
		channelByName: authenticated(AccountsServer, (root, { name, isDirect }, { models }) => {
			const query = {
				name
			};

			if (isDirect === true) {
				query.c = 'd';
			}

			return models.Rooms.findOne(query, {
				fields: roomPublicFields
			});
		}),
		channelsByUser: authenticated(AccountsServer, (root, { userId }, { models }) => {
			const user = models.Users.findOneById(userId);

			if (!user) {
				// TODO:
				throw new Error('No user');
			}

			return models.Rooms.find({
				'usernames': {
					$in: user.username
				}
			}, {
				sort: {
					name: 1
				},
				fields: roomPublicFields
			}).fetch();
		}),
		messages: authenticated(AccountsServer, (root, args, { models }) => {
			if (!args.channelId) {
				console.error('messages query must be called with channelId');
				return null;
			}

			const query = {};

			if (args.channelId) {
				query.rid = args.channelId;
			}

			const messagesArray = models.Messages.find(query).fetch();
			const channel = models.Rooms.findOne(args.channelId);

			return {
				cursor: 'CURSOR',
				channel,
				messagesArray
			};
		})
	},
	Mutation: {
		sendMessage: authenticated(AccountsServer, (root, { channelId, content }, { user }) => {
			const messageReturn = processWebhookMessage({
				roomId: channelId,
				text: content
			}, user)[0];

			if (!messageReturn) {
				throw new Error('Unknown error');
			}

			return messageReturn.message;
		})
	},
	Channel: {
		id: property('_id'),
		members: (root, args, { models }) => {
			return root.usernames.map(
				username => models.Users.findOneByUsername(username)
			);
		},
		owners: (root, args, { models }) => {
			// there might be no owner
			if (!root.u) {
				return;
			}

			return [models.Users.findOneByUsername(root.u.username)];
		},
		numberOfMembers: (root) => (root.usernames || []).length,
		numberOfMessages: property('msgs'),
		readOnly: (root) => root.ro === true,
		direct: (root) => root.t === 'd',
		privateChannel: (root) => root.t === 'p',
		favourite: (root, args, { user }) => {
			const room = findChannelByIdAndUser({
				params: {
					roomId: root._id,
					userId: user._id
				},
				options: { fields: { f: 1 }}
			});

			return room && room.f === true;
		},
		unseenMessages: (root, args, { user }) => {
			const room = findChannelByIdAndUser({
				params: {
					roomId: root._id,
					userId: user._id
				},
				options: { fields: { unread: 1 }}
			});

			return (room || {}).unread;
		}
	},
	Member: {
		id: property('_id')
	},
	Message: {
		id: property('_id'),
		content: property('msg'),
		creationTime: property('ts'),
		author: (root, args, { models }) => {
			return models.Users.findOne(root.u._id);
		},
		fromServer: (root) => typeof root.t !== 'undefined', // on a message sent by user `true` otherwise `false`
		channelRef: (root, args, { models }) => {
			if (!root.channels) {
				return;
			}

			return models.Rooms.find({
				_id: {
					$in: root.channels.map(c => c._id)
				}
			}, {
				sort: {
					name: 1
				}
			}).fetch();
		},
		userRef: (root, args, { models }) => {
			if (!root.mentions) {
				return;
			}

			return models.Users.find({
				_id: {
					$in: root.mentions.map(c => c._id)
				}
			}, {
				sort: {
					username: 1
				}
			}).fetch();
		},
		reactions: (root) => {
			if (!root.reactions || Object.keys(root.reactions).length === 0) {
				return;
			}

			const reactions = [];

			Object.keys(root.reactions).forEach(icon => {
				root.reactions[icon].usernames.forEach(username => {
					reactions.push({
						icon,
						username
					});
				});
			});

			return reactions;
		},
		// TODO
		tags: () => {}
	}
};

export const executableSchema = makeExecutableSchema({
	typeDefs: [schema],
	resolvers,
	logger: {
		log: (e) => console.log(e)
	}
});
