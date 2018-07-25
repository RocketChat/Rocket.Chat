class ModelSessions extends RocketChat.models._Base {
	constructor() {
		super(...arguments);

		this.tryEnsureIndex({ 'instanceId': 1, 'sessionId': 1, 'year': 1, 'month': 1, 'day': 1 }, { unique: 1 });
		this.tryEnsureIndex({ 'instanceId': 1, 'sessionId': 1, 'userId': 1 });
		this.tryEnsureIndex({ 'instanceId': 1, 'sessionId': 1 });
		//this.tryEnsureIndex({ 'year': 1, 'month': 1, 'day': 1 });
	}

	createOrUpdate(data = {}) {
		const { year, month, day, sessionId, instanceId } = data;

		if (!(year && month && day && sessionId && instanceId)) {
			return;
		}

		const now = new Date;

		return this.upsert({ instanceId, sessionId, year, month, day }, {
			$set: data,
			$setOnInsert: {
				createdAt: now
			}
		});
	}

	updateByInstanceIdAndSessionId(instanceId, sessionId, data = {}) {
		const query = {
			instanceId,
			sessionId
		};

		const update = {
			$set: data
		};

		return this.update(query, update, { multi: true });
	}

	updateActiveSessionsByDateAndInstanceIdAndIds({ year, month, day } = {}, instanceId, sessions, data = {}) {
		const query = {
			instanceId,
			year,
			month,
			day,
			sessionId: { $in: sessions },
			closedAt: { $exists: 0 }
		};

		const update = {
			$set: data
		};

		return this.update(query, update, { multi: true });
	}

	updateByInstanceIdAndSessionIdAndUserId(instanceId, sessionId, userId, data = {}) {
		const query = { instanceId, sessionId, userId };
		const update = {
			$set: data
		};

		return this.update(query, update, { multi: true });
	}
}

RocketChat.models.Sessions = new ModelSessions('sessions');
