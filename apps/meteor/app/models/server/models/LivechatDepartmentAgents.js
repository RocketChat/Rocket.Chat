import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { Base } from './_Base';
import Users from './Users';
/**
 * Livechat Department model
 */
export class LivechatDepartmentAgents extends Base {
	constructor() {
		super('livechat_department_agents');

		this.tryEnsureIndex({ departmentId: 1 });
		this.tryEnsureIndex({ departmentEnabled: 1 });
		this.tryEnsureIndex({ agentId: 1 });
		this.tryEnsureIndex({ username: 1 });

		const collectionObj = this.model.rawCollection();
		this.findAndModify = Meteor.wrapAsync(collectionObj.findAndModify, collectionObj);
	}

	findByDepartmentId(departmentId) {
		return this.find({ departmentId });
	}

	findByAgentId(agentId) {
		return this.find({ agentId });
	}

	findOneByAgentIdAndDepartmentId(agentId, departmentId) {
		return this.findOne({ agentId, departmentId });
	}

	saveAgent(agent) {
		return this.upsert(
			{
				agentId: agent.agentId,
				departmentId: agent.departmentId,
			},
			{
				$set: {
					username: agent.username,
					departmentEnabled: agent.departmentEnabled,
					count: parseInt(agent.count),
					order: parseInt(agent.order),
				},
			},
		);
	}

	removeByAgentId(agentId) {
		this.remove({ agentId });
	}

	removeByDepartmentIdAndAgentId(departmentId, agentId) {
		this.remove({ departmentId, agentId });
	}

	removeByDepartmentId(departmentId) {
		this.remove({ departmentId });
	}

	getNextAgentForDepartment(departmentId, ignoreAgentId, extraQuery) {
		const agents = this.findByDepartmentId(departmentId).fetch();

		if (agents.length === 0) {
			return;
		}

		const onlineUsers = Users.findOnlineUserFromList(_.pluck(agents, 'username'));

		const onlineUsernames = _.pluck(onlineUsers.fetch(), 'username');

		// get fully booked agents, to ignore them from the query
		const currentUnavailableAgents = Promise.await(Users.getUnavailableAgents(departmentId, extraQuery)).map((u) => u.username);

		const query = {
			departmentId,
			username: {
				$in: onlineUsernames,
				$nin: currentUnavailableAgents,
			},
			...(ignoreAgentId && { agentId: { $ne: ignoreAgentId } }),
		};

		const sort = {
			count: 1,
			order: 1,
			username: 1,
		};
		const update = {
			$inc: {
				count: 1,
			},
		};

		const collectionObj = this.model.rawCollection();

		const agent = Promise.await(collectionObj.findAndModify(query, sort, update));
		if (agent && agent.value) {
			return {
				agentId: agent.value.agentId,
				username: agent.value.username,
			};
		}
		return null;
	}

	checkOnlineForDepartment(departmentId) {
		const agents = this.findByDepartmentId(departmentId).fetch();

		if (agents.length === 0) {
			return false;
		}

		const onlineUser = Users.findOneOnlineAgentByUserList(_.pluck(agents, 'username'));

		return Boolean(onlineUser);
	}

	getOnlineForDepartment(departmentId) {
		const agents = this.findByDepartmentId(departmentId).fetch();

		if (agents.length === 0) {
			return;
		}

		const onlineUsers = Users.findOnlineUserFromList(_.pluck(agents, 'username'));

		const onlineUsernames = _.pluck(onlineUsers.fetch(), 'username');

		const query = {
			departmentId,
			username: {
				$in: onlineUsernames,
			},
		};

		return this.find(query);
	}

	getBotsForDepartment(departmentId) {
		const agents = this.findByDepartmentId(departmentId).fetch();

		if (agents.length === 0) {
			return;
		}

		const botUsers = Users.findBotAgents(_.pluck(agents, 'username'));
		const botUsernames = _.pluck(botUsers.fetch(), 'username');

		const query = {
			departmentId,
			username: {
				$in: botUsernames,
			},
		};

		return this.find(query);
	}

	getNextBotForDepartment(departmentId, ignoreAgentId) {
		const agents = this.findByDepartmentId(departmentId).fetch();

		if (agents.length === 0) {
			return;
		}

		const botUsers = Users.findBotAgents(_.pluck(agents, 'username'));
		const botUsernames = _.pluck(botUsers.fetch(), 'username');

		const query = {
			departmentId,
			username: {
				$in: botUsernames,
			},
			...(ignoreAgentId && { agentId: { $ne: ignoreAgentId } }),
		};

		const sort = {
			count: 1,
			order: 1,
			username: 1,
		};
		const update = {
			$inc: {
				count: 1,
			},
		};

		const bot = this.findAndModify(query, sort, update);
		if (bot && bot.value) {
			return {
				agentId: bot.value.agentId,
				username: bot.value.username,
			};
		}
		return null;
	}

	findUsersInQueue(usersList) {
		const query = {};

		if (!_.isEmpty(usersList)) {
			query.username = {
				$in: usersList,
			};
		}

		const options = {
			sort: {
				departmentId: 1,
				count: 1,
				order: 1,
				username: 1,
			},
		};

		return this.find(query, options);
	}

	replaceUsernameOfAgentByUserId(userId, username) {
		const query = { agentId: userId };

		const update = {
			$set: {
				username,
			},
		};

		return this.update(query, update, { multi: true });
	}

	setDepartmentEnabledByDepartmentId(departmentId, departmentEnabled) {
		return this.update({ departmentId }, { $set: { departmentEnabled } }, { multi: true });
	}
}
export default new LivechatDepartmentAgents();
