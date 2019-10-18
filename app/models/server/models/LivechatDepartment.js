import _ from 'underscore';

import { Base } from './_Base';
import LivechatDepartmentAgents from './LivechatDepartmentAgents';
/**
 * Livechat Department model
 */
export class LivechatDepartment extends Base {
	constructor(modelOrName) {
		super(modelOrName || 'livechat_department');

		this.tryEnsureIndex({
			numAgents: 1,
			enabled: 1,
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

	createOrUpdateDepartment(_id, data = {}, agents) {
		// We need to allow updating Departments without having to inform agents, so now we'll only
		// update the agent/numAgents fields when the agent parameter is an Array, otherwise we skipp those fields
		const hasAgents = agents && Array.isArray(agents);
		const numAgents = hasAgents && agents.length;

		const record = {
			...data,
			...hasAgents && { numAgents },
		};

		if (_id) {
			this.update({ _id }, { $set: record });
		} else {
			_id = this.insert(record);
		}

		if (hasAgents) {
			const savedAgents = _.pluck(LivechatDepartmentAgents.findByDepartmentId(_id).fetch(), 'agentId');
			const agentsToSave = _.pluck(agents, 'agentId');

			// remove other agents
			_.difference(savedAgents, agentsToSave).forEach((agentId) => {
				LivechatDepartmentAgents.removeByDepartmentIdAndAgentId(_id, agentId);
			});

			agents.forEach((agent) => {
				LivechatDepartmentAgents.saveAgent({
					agentId: agent.agentId,
					departmentId: _id,
					username: agent.username,
					count: agent.count ? parseInt(agent.count) : 0,
					order: agent.order ? parseInt(agent.order) : 0,
				});
			});
		}

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
			enabled: true,
		};
		return this.find(query);
	}

	findOneByIdOrName(_idOrName, options) {
		const query = {
			$or: [{
				_id: _idOrName,
			}, {
				name: _idOrName,
			}],
		};

		return this.findOne(query, options);
	}
}

export default new LivechatDepartment();
