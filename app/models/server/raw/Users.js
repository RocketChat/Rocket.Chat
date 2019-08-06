import { BaseRaw } from './BaseRaw';

export class UsersRaw extends BaseRaw {
	findUsersInRoles(roles, scope, options) {
		roles = [].concat(roles);

		const query = {
			roles: { $in: roles },
		};

		return this.find(query, options);
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

	findAllResumeTokensByUserId(userId) {
		return this.col.aggregate([
			{
				$match: {
					_id: userId,
				},
			},
			{
				$project: {
					tokens: {
						$filter: {
							input: '$services.resume.loginTokens',
							as: 'token',
							cond: {
								$ne: ['$$token.type', 'personalAccessToken'],
							},
						},
					},
				},
			},
			{ $unwind: '$tokens' },
			{ $sort: { 'tokens.when': 1 } },
			{ $group: { _id: '$_id', tokens: { $push: '$tokens' } } },
		]).toArray();
	}
}
