import { Base } from './_Base';

export class Sessions extends Base {
	constructor(...args) {
		super(...args);

		this.tryEnsureIndex({ instanceId: 1, sessionId: 1, year: 1, month: 1, day: 1 });
		this.tryEnsureIndex({ instanceId: 1, sessionId: 1, userId: 1 });
		this.tryEnsureIndex({ instanceId: 1, sessionId: 1 });
		this.tryEnsureIndex({ year: 1, month: 1, day: 1, type: 1 });
		this.tryEnsureIndex({ _computedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 45 });
	}

	getUniqueUsersOfYesterday() {
		const date = new Date();
		date.setDate(date.getDate() - 1);

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();

		return {
			year,
			month,
			day,
			data: Promise.await(this.model.rawCollection().aggregate([{
				$match: {
					year,
					month,
					day,
					type: 'user_daily',
				},
			}, {
				$group: {
					_id: {
						day: '$day',
						month: '$month',
						year: '$year',
					},
					count: {
						$sum: '$count',
					},
					time: {
						$sum: '$time',
					},
				},
			}, {
				$project: {
					_id: 0,
					count: 1,
					time: 1,
				},
			}]).toArray()),
		};
	}

	getUniqueUsersOfLastMonth() {
		const date = new Date();
		date.setMonth(date.getMonth() - 1);

		const year = date.getFullYear();
		const month = date.getMonth() + 1;

		return {
			year,
			month,
			data: Promise.await(this.model.rawCollection().aggregate([{
				$match: {
					year,
					month,
					type: 'user_daily',
				},
			}, {
				$group: {
					_id: {
						month: '$month',
						year: '$year',
					},
					count: {
						$sum: '$count',
					},
					time: {
						$sum: '$time',
					},
				},
			}, {
				$project: {
					_id: 0,
					count: 1,
					time: 1,
				},
			}]).toArray()),
		};
	}

	getUniqueDevicesOfYesterday() {
		const date = new Date();
		date.setDate(date.getDate() - 1);

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();

		return {
			year,
			month,
			day,
			data: Promise.await(this.model.rawCollection().aggregate([{
				$match: {
					year,
					month,
					day,
					type: 'user_daily',
				},
			}, {
				$unwind: '$devices',
			}, {
				$group: {
					_id: {
						type : '$devices.type',
						name : '$devices.name',
						version : '$devices.version',
					},
					count: {
						$sum: '$count',
					},
				},
			}, {
				$project: {
					_id: 0,
					type: '$_id.type',
					name: '$_id.name',
					version: '$_id.version',
					count: 1,
				},
			}]).toArray()),
		};
	}

	getUniqueOSOfYesterday() {
		const date = new Date();
		date.setDate(date.getDate() - 1);

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();

		return {
			year,
			month,
			day,
			data: Promise.await(this.model.rawCollection().aggregate([{
				$match: {
					year,
					month,
					day,
					type: 'user_daily',
					'devices.os.name': {
						$exists: true,
					},
				},
			}, {
				$unwind: '$devices',
			}, {
				$group: {
					_id: {
						name : '$devices.os.name',
						version : '$devices.os.version',
					},
					count: {
						$sum: '$count',
					},
				},
			}, {
				$project: {
					_id: 0,
					name: '$_id.name',
					version: '$_id.version',
					count: 1,
				},
			}]).toArray()),
		};
	}

	createOrUpdate(data = {}) {
		const { year, month, day, sessionId, instanceId } = data;

		if (!year || !month || !day || !sessionId || !instanceId) {
			return;
		}

		const now = new Date;

		return this.upsert({ instanceId, sessionId, year, month, day }, {
			$set: data,
			$setOnInsert: {
				createdAt: now,
			},
		});
	}

	closeByInstanceIdAndSessionId(instanceId, sessionId) {
		const query = {
			instanceId,
			sessionId,
			closedAt: { $exists: 0 },
		};

		const closeTime = new Date();
		const update = {
			$set: {
				closedAt: closeTime,
				lastActivityAt: closeTime,
			},
		};

		return this.update(query, update);
	}

	updateActiveSessionsByDateAndInstanceIdAndIds({ year, month, day } = {}, instanceId, sessions, data = {}) {
		const query = {
			instanceId,
			year,
			month,
			day,
			sessionId: { $in: sessions },
			closedAt: { $exists: 0 },
		};

		const update = {
			$set: data,
		};

		return this.update(query, update, { multi: true });
	}

	logoutByInstanceIdAndSessionIdAndUserId(instanceId, sessionId, userId) {
		const query = {
			instanceId,
			sessionId,
			userId,
			logoutAt: { $exists: 0 },
		};

		const logoutAt = new Date();
		const update = {
			$set: {
				logoutAt,
			},
		};

		return this.update(query, update, { multi: true });
	}

	createBatch(sessions) {
		if (!sessions || sessions.length === 0) {
			return;
		}

		const ops = [];
		sessions.forEach((doc) => {
			const { year, month, day, sessionId, instanceId } = doc;
			delete doc._id;

			ops.push({
				updateOne: {
					filter: { year, month, day, sessionId, instanceId },
					update: {
						$set: doc,
					},
					upsert: true,
				},
			});
		});

		return this.model.rawCollection().bulkWrite(ops, { ordered: false });
	}
}

export default new Sessions('sessions');
