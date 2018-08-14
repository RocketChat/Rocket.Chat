import { RocketChat } from 'meteor/rocketchat:lib';

import { authenticated } from '../../helpers/authenticated';
import { roomPublicFields } from './settings';
import schema from '../../schemas/channels/channels.graphqls';

const resolver = {
	Query: {
		channels: authenticated((root, args) => {
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

			return RocketChat.models.Rooms.find(query, options).fetch();
		})
	}
};


export {
	schema,
	resolver
};
