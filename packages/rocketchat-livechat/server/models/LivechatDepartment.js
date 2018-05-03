import _ from 'underscore';

/**
 * Livechat Department model
 */
class LivechatDepartment extends RocketChat.models._Base {
	constructor() {
		super('livechat_department');

		this.tryEnsureIndex({
			numAgents: 1,
			enabled: 1
		});
	}

	// FIND
	findOneById(_id, options) {
		const query = { _id };

		return this.findOne(query, options);
	}

	findByDepartmentId(_id, options) {
		const query = { _id };

		return this.find(query, options);
	}

	createOrUpdateDepartment(_id, { enabled, name, description, showOnRegistration }, agents) {
		agents = [].concat(agents);

		const record = {
			enabled,
			name,
			description,
			numAgents: agents.length,
			showOnRegistration
		};

		if (_id) {
			this.update({ _id }, { $set: record });
		} else {
			_id = this.insert(record);
		}

		const savedAgents = _.pluck(RocketChat.models.LivechatDepartmentAgents.findByDepartmentId(_id).fetch(), 'agentId');
		const agentsToSave = _.pluck(agents, 'agentId');

		// remove other agents
		_.difference(savedAgents, agentsToSave).forEach((agentId) => {
			RocketChat.models.LivechatDepartmentAgents.removeByDepartmentIdAndAgentId(_id, agentId);
		});

		agents.forEach((agent) => {
			RocketChat.models.LivechatDepartmentAgents.saveAgent({
				agentId: agent.agentId,
				departmentId: _id,
				username: agent.username,
				count: agent.count ? parseInt(agent.count) : 0,
				order: agent.order ? parseInt(agent.order) : 0
			});
		});

		return _.extend(record, { _id });
	}

	// REMOVE
	removeById(_id) {
		const query = { _id };

		return this.remove(query);
	}

	findEnabledWithAgents() {
		const query = {
			numAgents: { $gt: 0 },
			enabled: true
		};
		return this.find(query);
	}
}

RocketChat.models.LivechatDepartment = new LivechatDepartment();
