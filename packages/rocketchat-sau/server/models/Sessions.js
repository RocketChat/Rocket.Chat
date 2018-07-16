class ModelSessions extends RocketChat.models._Base {
	constructor() {
		super(...arguments);

		this.tryEnsureIndex({ 'year': 1, 'month': 1, 'day': 1, 'sessionId': 1 }, { unique: 1 });
		this.tryEnsureIndex({ 'lastActivityAt': 1, 'sparse': 1 });
	}

	createOrUpdate(data) {
		const { year, month, day, sessionId } = data;
		return this.upsert({ year, month, day, sessionId }, { $set: data });
	}
}

RocketChat.models.Sessions = new ModelSessions('sessions');
