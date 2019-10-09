import { BaseRaw } from './BaseRaw';

export class SubscriptionsRaw extends BaseRaw {
	// count
	countByRoomId(roomId) {
		const query = {
			rid: roomId,
		};

		return this.col.count(query);
	}

	countByUserId(userId) {
		const query = {
			'u._id': userId,
		};

		return this.col.count(query);
	}

	// find
	findOneByRoomIdAndUserId(rid, uid, options) {
		const query = {
			rid,
			'u._id': uid,
		};

		return this.col.findOne(query, options);
	}

	findByRoomId(roomId, options) {
		const query = {
			rid: roomId,
		};

		return this.col.find(query, options);
	}

	findByUserId(userId, options) {
		const query = {
			'u._id': userId,
		};

		return this.col.find(query, options);
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
