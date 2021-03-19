import { Team } from '../../../../server/sdk';

export const SpotlightEnterprise = {
	mapTeams(_, teams) {
		return teams.map((t) => {
			t.isTeam = true;
			t.username = t.name;
			t.status = 'online';
			return t;
		});
	},

	_searchTeams(_, userId, { text, options, users }) {
		options.limit -= users.length;

		if (options.limit <= 0) {
			return users;
		}

		const teamOptions = { ...options, projection: { name: 1, type: 1 } };
		const teams = Promise.await(Team.search(userId, text, teamOptions));
		users.push(...this.mapTeams(teams));

		return users;
	},

	_performExtraUserSearches(_, userId, searchParams) {
		if (this._searchTeams(userId, searchParams)) {
			return searchParams.users;
		}
	},
};
