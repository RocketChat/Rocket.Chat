import { Team } from '@rocket.chat/core-services';

export const MentionQueriesEnterprise = {
	async getUsers(sup, usernames) {
		const uniqueUsernames = [...new Set(usernames)];
		const teams = await Team.listByNames(uniqueUsernames, { projection: { name: 1 } });

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
