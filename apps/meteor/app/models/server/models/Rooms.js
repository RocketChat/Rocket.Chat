import { Subscriptions } from '@rocket.chat/models';

import { Base } from './_Base';
import { trim } from '../../../../lib/utils/stringUtils';

// TODO: Promise.awaits will go with the model so..
class Rooms extends Base {
	constructor(...args) {
		super(...args);

		this.tryEnsureIndex({ name: 1 }, { unique: true, sparse: true });
		this.tryEnsureIndex({ default: 1 }, { sparse: true });
		this.tryEnsureIndex({ featured: 1 }, { sparse: true });
		this.tryEnsureIndex({ muted: 1 }, { sparse: true });
		this.tryEnsureIndex({ t: 1 });
		this.tryEnsureIndex({ 'u._id': 1 });
		this.tryEnsureIndex({ ts: 1 });
		// discussions
		this.tryEnsureIndex({ prid: 1 }, { sparse: true });
		this.tryEnsureIndex({ fname: 1 }, { sparse: true });
		// field used for DMs only
		this.tryEnsureIndex({ uids: 1 }, { sparse: true });
		this.tryEnsureIndex({ createdOTR: 1 }, { sparse: true });
		this.tryEnsureIndex({ encrypted: 1 }, { sparse: true }); // used on statistics
		this.tryEnsureIndex({ broadcast: 1 }, { sparse: true }); // used on statistics
		this.tryEnsureIndex({ 'streamingOptions.type': 1 }, { sparse: true }); // used on statistics

		this.tryEnsureIndex(
			{
				teamId: 1,
				teamDefault: 1,
			},
			{ sparse: true },
		);
	}

	findOneByImportId(_id, options) {
		const query = { importIds: _id };

		return this.findOne(query, options);
	}

	findOneByNonValidatedName(name, options) {
		const room = this.findOneByNameOrFname(name, options);
		if (room) {
			return room;
		}

		let channelName = trim(name);
		try {
			// TODO evaluate if this function call should be here
			const { getValidRoomName } = Promise.await(import('../../../utils/server/lib/getValidRoomName'));
			channelName = getValidRoomName(channelName, null, { allowDuplicates: true });
		} catch (e) {
			console.error(e);
		}

		return this.findOneByName(channelName, options);
	}

	findOneByName(name, options) {
		const query = { name };

		return this.findOne(query, options);
	}

	findOneByNameOrFname(name, options) {
		const query = {
			$or: [
				{
					name,
				},
				{
					fname: name,
				},
			],
		};

		return this.findOne(query, options);
	}

	findOneByNameAndNotId(name, rid) {
		const query = {
			_id: { $ne: rid },
			name,
		};

		return this.findOne(query);
	}

	findOneByDisplayName(fname, options) {
		const query = { fname };

		return this.findOne(query, options);
	}

	// FIND

	findById(roomId, options) {
		return this.find({ _id: roomId }, options);
	}

	findByIds(roomIds, options) {
		return this.find({ _id: { $in: [].concat(roomIds) } }, options);
	}

	findByType(type, options) {
		const query = { t: type };

		return this.find(query, options);
	}

	findByTypeInIds(type, ids, options) {
		const query = {
			_id: {
				$in: ids,
			},
			t: type,
		};

		return this.find(query, options);
	}

	findByUserId(userId, options) {
		const query = { 'u._id': userId };

		return this.find(query, options);
	}

	findBySubscriptionUserId(userId, options) {
		const data = Subscriptions.cachedFindByUserId(userId, { fields: { rid: 1 } })
			.fetch()
			.map((item) => item.rid);

		const query = {
			_id: {
				$in: data,
			},
			$or: [
				{
					teamId: {
						$exists: false,
					},
				},
				{
					teamId: {
						$exists: true,
					},
					_id: {
						$in: data,
					},
				},
			],
		};

		return this.find(query, options);
	}

	findBySubscriptionUserIdUpdatedAfter(userId, _updatedAt, options) {
		const ids = Subscriptions.findByUserId(userId, { fields: { rid: 1 } })
			.fetch()
			.map((item) => item.rid);

		const query = {
			_id: {
				$in: ids,
			},
			_updatedAt: {
				$gt: _updatedAt,
			},
			$or: [
				{
					teamId: {
						$exists: false,
					},
				},
				{
					teamId: {
						$exists: true,
					},
					_id: {
						$in: ids,
					},
				},
			],
		};

		return this.find(query, options);
	}

	findByNameAndType(name, type, options) {
		const query = {
			t: type,
			name,
		};

		// do not use cache
		return this._db.find(query, options);
	}

	findByNameOrFNameAndType(name, type, options) {
		const query = {
			t: type,
			teamId: {
				$exists: false,
			},
			$or: [
				{
					name,
				},
				{
					fname: name,
				},
			],
		};

		// do not use cache
		return this._db.find(query, options);
	}

	findByNameAndTypeNotDefault(name, type, options, includeFederatedRooms = false) {
		const query = {
			t: type,
			default: {
				$ne: true,
			},
			$or: [
				{
					teamId: {
						$exists: false,
					},
				},
				{
					teamMain: true,
				},
			],
			...(includeFederatedRooms
				? { $or: [{ $and: [{ $or: [{ federated: { $exists: false } }, { federated: false }], name }] }, { federated: true, fname: name }] }
				: { $or: [{ federated: { $exists: false } }, { federated: false }], name }),
		};

		// do not use cache
		return this._db.find(query, options);
	}

	findByNameAndTypesNotInIds(name, types, ids, options, includeFederatedRooms = false) {
		const query = {
			_id: {
				$nin: ids,
			},
			t: {
				$in: types,
			},
			$or: [
				{
					teamId: {
						$exists: false,
					},
				},
				{
					teamId: {
						$exists: true,
					},
					_id: {
						$in: ids,
					},
				},
				{
					// Also return the main room of public teams
					// this will have no effect if the method is called without the 'c' type, as the type filter is outside the $or group.
					teamMain: true,
					t: 'c',
				},
			],
			...(includeFederatedRooms
				? {
						$or: [{ $and: [{ $or: [{ federated: { $exists: false } }, { federated: false }], name }] }, { federated: true, fname: name }],
				  }
				: { $or: [{ federated: { $exists: false } }, { federated: false }], name }),
		};

		// do not use cache
		return this._db.find(query, options);
	}

	findByDefaultAndTypes(defaultValue, types, options) {
		const query = {
			default: defaultValue,
			t: {
				$in: types,
			},
		};

		return this.find(query, options);
	}

	findDirectRoomContainingAllUsernames(usernames, options) {
		const query = {
			t: 'd',
			usernames: { $size: usernames.length, $all: usernames },
			usersCount: usernames.length,
		};

		return this.findOne(query, options);
	}

	findOneDirectRoomContainingAllUserIDs(uid, options) {
		const query = {
			t: 'd',
			uids: { $size: uid.length, $all: uid },
		};

		return this.findOne(query, options);
	}

	// UPDATE

	incMsgCountById(_id, inc = 1) {
		const query = { _id };

		const update = {
			$inc: {
				msgs: inc,
			},
		};

		return this.update(query, update);
	}

	incUsersCountById(_id, inc = 1) {
		const query = { _id };

		const update = {
			$inc: {
				usersCount: inc,
			},
		};

		return this.update(query, update);
	}

	incUsersCountByIds(ids, inc = 1) {
		const query = {
			_id: {
				$in: ids,
			},
		};

		const update = {
			$inc: {
				usersCount: inc,
			},
		};

		return this.update(query, update, { multi: true });
	}

	incUsersCountNotDMsByIds(ids, inc = 1) {
		const query = {
			_id: {
				$in: ids,
			},
			t: { $ne: 'd' },
		};

		const update = {
			$inc: {
				usersCount: inc,
			},
		};

		return this.update(query, update, { multi: true });
	}
}

export default new Rooms('room', true);
