import {
	makeExecutableSchema
} from 'graphql-tools';

import {
	property
} from './helpers/property';

import {
	findChannelByIdAndUser
} from './helpers/findChannelByIdAndUser';

// mys:admin
const testUser = 'fnw4B4suFsTXf8rZq';

const schema = `
	type schema {
		query: Query
	}

	type Query {
		channels(filter: ChannelFilter = {
			privacy: ALL,
			joinedChannels: false,
			sortBy: NAME
		}): [Channel]
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
`;

const resolvers = {
	Query: {
		channels: (root, args) => {
			const query = {};
			const options = {
				sort: {
					name: 1
				},
				fields: {
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
				}
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

			return RocketChat.models.Rooms.find(query, options).fetch();
		}
	},
	Channel: {
		id: property('_id'),
		members: (root) => {
			return root.usernames.map(
				username => RocketChat.models.Users.findOneByUsername(username, {
					fields: {
						name: 1
					}
				})
			);
		},
		owners: (root) => {
			// there might be no owner
			if (!root.u) {
				return [];
			}

			return [RocketChat.models.Users.findOneByUsername(root.u.username, {
				fields: {
					name: 1
				}
			})];
		},
		numberOfMembers: (root) => (root.usernames || []).length,
		numberOfMessages: property('msgs'),
		readOnly: (root) => root.ro === true,
		direct: (root) => root.t === 'd',
		privateChannel: (root) => root.t === 'p',
		favourite: (root) => {
			const room = findChannelByIdAndUser({
				params: {
					roomId: root._id,
					userId: testUser
				},
				options: { fields: { f: 1 }}
			});

			return room && room.f === true;
		},
		unseenMessages: (root) => {
			const room = findChannelByIdAndUser({
				params: {
					roomId: root._id,
					userId: testUser
				},
				options: { fields: { unread: 1 }}
			});

			return (room || {}).unread;
		}
	},
	Member: {
		id: property('_id')
	}
};

export const executableSchema = makeExecutableSchema({
	typeDefs: [schema],
	resolvers,
	logger: {
		log: (e) => console.log(e)
	}
});
