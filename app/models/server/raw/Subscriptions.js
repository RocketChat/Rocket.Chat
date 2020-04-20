import { BaseRaw } from './BaseRaw';

export class SubscriptionsRaw extends BaseRaw {
	findOneByRoomIdAndUserId(rid, uid, options) {
		const query = {
			rid,
			'u._id': uid,
		};

		return this.col.findOne(query, options);
	}

	countByRoomIdAndUserId(rid, uid) {
		const query = {
			rid,
			'u._id': uid,
		};

		const cursor = this.col.find(query);

		return cursor.count();
	}

	isUserInRole(uid, roleName, rid) {
		if (rid == null) {
			return;
		}

		const query = {
			'u._id': uid,
			rid,
			roles: roleName,
		};

		return this.findOne(query, { fields: { roles: 1 } });
	}
}
