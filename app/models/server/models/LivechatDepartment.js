import _ from 'underscore';

import { Base } from './_Base';
import LivechatDepartmentAgents from './LivechatDepartmentAgents';
/**
 * Livechat Department model
 */
export class LivechatDepartment extends Base {
	constructor(modelOrName) {
		super(modelOrName || 'livechat_department');

		this.tryEnsureIndex({ name: 1 });
		this.tryEnsureIndex({ businessHourId: 1 }, { sparse: true });
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

		return _.extend(record, { _id });
	}

	saveDepartmentsByAgent(agent, departments = []) {
		const { _id: agentId, username } = agent;
		const savedDepartments = LivechatDepartmentAgents.findByAgentId(agentId).fetch().map((d) => d.departmentId);

		const incNumAgents = (_id, numAgents) => this.update(_id, { $inc: { numAgents } });
		// remove other departments
		_.difference(savedDepartments, departments).forEach((departmentId) => {
			LivechatDepartmentAgents.removeByDepartmentIdAndAgentId(departmentId, agentId);
			incNumAgents(departmentId, -1);
		});

		departments.forEach((departmentId) => {
			const saveResult = LivechatDepartmentAgents.saveAgent({
				agentId,
				departmentId,
				username,
				count: 0,
				order: 0,
			});

			if (saveResult.insertedId) {
				incNumAgents(departmentId, 1);
			}
		});
	}

	updateById(_id, update) {
		return this.update({ _id }, update);
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
