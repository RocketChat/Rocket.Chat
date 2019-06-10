import { BaseRaw } from './BaseRaw';

export class SubscriptionsRaw extends BaseRaw {
	findOneByRoomIdAndUserId(roomId, userId, options) {
		const query = {
			rid: roomId,
			'u._id': userId,
		};

		return this.col.findOne(query, options);
	}

	// async findUsersInRoles(roles, scope, options) {
	// 	roles = [].concat(roles);

	// 	const query = {
	// 		roles: { $in: roles },
	// 	};

	// 	if (scope) {
	// 		query.rid = scope;
	// 	}

	// 	const subscriptions = await this.find(query).toArray();

	// 	const users = subscriptions
	// 		.filter((sub) => sub.u && sub.u._id)
	// 		.map((sub) => sub.u._id);

	// 	console.log('users ->', users);

	// 	return Users.find({ _id: { $in: users } }, options);
	// }

	isUserInRole(userId, roleName, rid) {
		if (rid == null) {
			return;
		}

		const query = {
			'u._id': userId,
			rid,
			roles: roleName,
		};

		return this.findOne(query, { fields: { roles: 1 } });
	}
}
