import { _ } from 'meteor/underscore';

import { Team } from '../../../../server/sdk';

export const MentionQueriesEnterprise = {
	getUsers(sup, usernames) {
		const uniqueUsernames = _.unique(usernames);
		const teams = Promise.await(Team.listByNames(uniqueUsernames), { projection: { _id: 1, name: 1 } });

		if (!teams || !teams.length) {
			return sup(usernames);
		}

		return teams.map((team) => {
			team.mentionType = 'team';
			return team;
		}).concat(sup(usernames));
	},
};
