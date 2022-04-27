import { Team } from '../../../../server/sdk';

export const MentionQueriesEnterprise = {
	getUsers(sup, usernames) {
		const uniqueUsernames = [...new Set(usernames)];
		const teams = Promise.await(Team.listByNames(uniqueUsernames, { projection: { name: 1 } }));

		if (!teams?.length) {
			return sup(usernames);
		}

		return teams
			.map((team) => ({
				...team,
				type: 'team',
			}))
			.concat(sup(usernames));
	},
};
