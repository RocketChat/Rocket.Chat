import { Base } from './_Base';

class Invites extends Base {
	constructor() {
		super('invites');

		this.tryEnsureIndex({ hash: 1 });
	}

	findOneByHash(hash) {
		return this.findOne({ hash });
	}

	findOneByUserRoomMaxUsesAndExpiration(userId, rid, maxUses, daysToExpire) {
		const query = {
			rid,
			userId,
			days: daysToExpire,
			maxUses,
		};

		if (daysToExpire > 0) {
			query.expires = {
				$gt: Date.now(),
			};
		}

		if (maxUses > 0) {
			query.uses = 0;
		}

		return this.findOne(query);
	}

	// INSERT
	create(data) {
		return this.insert(data);
	}

	// REMOVE
	removeById(_id) {
		return this.remove({ _id });
	}
}

export default new Invites();
