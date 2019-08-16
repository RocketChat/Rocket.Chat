import { BaseRaw } from './BaseRaw';

export class UsersRaw extends BaseRaw {
	getRoles(_id) {
		return this.col.findOne({ _id }, { projection: { roles: 1 } });
	}

	findUsersInRoles(roles, scope, options) {
		roles = [].concat(roles);

		const query = {
			roles: { $in: roles },
		};

		return this.col.find(query, options);
	}

	isUserInRole(userId, roleName) {
		const query = {
			_id: userId,
			roles: roleName,
		};

		return this.findOne(query, { fields: { roles: 1 } });
	}

	getDistinctFederationPeers() {
		return this.col.distinct('federation.peer', { federation: { $exists: true } });
	}
}
