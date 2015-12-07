/**
 * Livechat Department model
 */
class LivechatDepartment extends RocketChat.models._Base {
	constructor() {
		super();
		this._initModel('livechat_department');
	}

	// FIND
	findOneById(_id, options) {
		query = { _id: _id };

		return this.findOne(query, options);
	}

	findByDepartmentId(_id, options) {
		query = { _id: _id };
		return this.find(query, options);
	}

	// UPSERT
	createOrUpdateDepartment(_id, enabled, name, description, agents, extraData) {
		record = {
			enabled: enabled,
			name: name,
			description: description,
			agents: []
		}

		if (!_.isEmpty(agents)) {
			for (agent of agents) {
				record.agents.push({ _id: agent._id, username: agent.username });
			}
		}

		_.extend(record, extraData);
		this.upsert({ _id: _id }, { $set: record });
		return _.extend(record, { _id: _id });
	}

	// REMOVE
	removeById(_id) {
		query = { _id: _id };
		return this.remove(query);
	}
}

RocketChat.models.LivechatDepartment = new LivechatDepartment();
