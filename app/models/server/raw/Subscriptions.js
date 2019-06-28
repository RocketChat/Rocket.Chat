import { BaseRaw } from './BaseRaw';

export class SubscriptionsRaw extends BaseRaw {
	findOneByRoomIdAndUserId(roomId, userId, options) {
		const query = {
			rid: roomId,
			'u._id': userId,
		};

		return this.col.findOne(query, options);
	}

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
