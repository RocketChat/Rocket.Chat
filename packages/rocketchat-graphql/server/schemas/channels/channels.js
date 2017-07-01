import { authenticated } from '../../mocks/accounts/graphql-api';
import AccountsServer from '../../mocks/accounts/server';
import { roomPublicFields } from './settings';

export const schema = `
	type Query {
		channels(filter: ChannelFilter = {
			privacy: ALL,
			joinedChannels: false,
			sortBy: NAME
		}): [Channel]
	}
`;

export const resolver = {
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
				// nameFilter
				if (typeof args.filter.nameFilter !== undefined) {
					query.name = {
						$regex: new RegExp(args.filter.nameFilter, 'i')
					};
				}

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
		})
	}
};
