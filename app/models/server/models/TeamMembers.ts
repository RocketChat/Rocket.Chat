import { Base } from './_Base';

export class TeamMembers extends Base {
	constructor() {
		super('team_member');
		// this.tryEnsureIndex({ t: 1, ip: 1, ts: -1 });
		// this.tryEnsureIndex({ t: 1, 'u.username': 1, ts: -1 });
	}

	// TODO: this might be needed after changing scope to here
	// findUsersInRoles(...args) {
	// 	console.log('vai', args);
	// }
}

export default new TeamMembers();
