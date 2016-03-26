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
		const query = { _id: _id };

		return this.findOne(query, options);
	}

	findByDepartmentId(_id, options) {
		const query = { _id: _id };

		return this.find(query, options);
	}

	createOrUpdateDepartment(_id, enabled, name, description, agents, extraData) {
		agents = [].concat(agents);

		var record = {
			enabled: enabled,
			name: name,
			description: description,
			numAgents: agents.length
		};

		_.extend(record, extraData);

		if (_id) {
			this.update({ _id: _id }, { $set: record });
		} else {
			_id = this.insert(record);
		}

		var savedAgents = _.pluck(RocketChat.models.LivechatDepartmentAgents.findByDepartmentId(_id).fetch(), 'agentId');
		var agentsToSave = _.pluck(agents, 'agentId');

		// remove other agents
		_.difference(savedAgents, agentsToSave).forEach((agentId) => {
			RocketChat.models.LivechatDepartmentAgents.removeByDepartmentIdAndAgentId(_id, agentId);
		});

		agents.forEach((agent) => {
			RocketChat.models.LivechatDepartmentAgents.saveAgent({
				agentId: agent.agentId,
				departmentId: _id,
				username: agent.username,
				count: parseInt(agent.count),
				order: parseInt(agent.order)
			});
		});

		return _.extend(record, { _id: _id });
	}

	// REMOVE
	removeById(_id) {
		const query = { _id: _id };

		return this.remove(query);
	}

	findEnabledWithAgents() {
		var query = {
			numAgents: { $gt: 0 },
			enabled: true
		};
		return this.find(query);
	}
}

RocketChat.models.LivechatDepartment = new LivechatDepartment();
