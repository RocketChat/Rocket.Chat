/**
 * Livechat Department model
 */
class LivechatDepartmentAgents extends RocketChat.models._Base {
	constructor() {
		super('livechat_department_agents');
	}

	findByDepartmentId(departmentId) {
		return this.find({ departmentId });
	}

	saveAgent(agent) {
		return this.upsert({
			agentId: agent.agentId,
			departmentId: agent.departmentId
		}, {
			$set: {
				username: agent.username,
				count: parseInt(agent.count),
				order: parseInt(agent.order)
			}
		});
	}

	removeByDepartmentIdAndAgentId(departmentId, agentId) {
		this.remove({ departmentId, agentId });
	}

	getNextAgentForDepartment(departmentId) {
		const agents = this.findByDepartmentId(departmentId).fetch();

		if (agents.length === 0) {
			return;
		}

		const onlineUsers = RocketChat.models.Users.findOnlineUserFromList(_.pluck(agents, 'username'));

		const onlineUsernames = _.pluck(onlineUsers.fetch(), 'username');

		const query = {
			departmentId,
			username: {
				$in: onlineUsernames
			}
		};

		const sort = {
			count: 1,
			order: 1,
			username: 1
		};
		const update = {
			$inc: {
				count: 1
			}
		};

		const collectionObj = this.model.rawCollection();
		const findAndModify = Meteor.wrapAsync(collectionObj.findAndModify, collectionObj);

		const agent = findAndModify(query, sort, update);
		if (agent && agent.value) {
			return {
				agentId: agent.value.agentId,
				username: agent.value.username
			};
		} else {
			return null;
		}
	}

	getOnlineForDepartment(departmentId) {
		const agents = this.findByDepartmentId(departmentId).fetch();

		if (agents.length === 0) {
			return [];
		}

		const onlineUsers = RocketChat.models.Users.findOnlineUserFromList(_.pluck(agents, 'username'));

		const onlineUsernames = _.pluck(onlineUsers.fetch(), 'username');

		const query = {
			departmentId,
			username: {
				$in: onlineUsernames
			}
		};

		const depAgents = this.find(query);

		if (depAgents) {
			return depAgents;
		} else {
			return [];
		}
	}

	findUsersInQueue(usersList) {
		const query = {};

		if (!_.isEmpty(usersList)) {
			query.username = {
				$in: usersList
			};
		}

		const options = {
			sort: {
				departmentId: 1,
				count: 1,
				order: 1,
				username: 1
			}
		};

		return this.find(query, options);
	}
}

RocketChat.models.LivechatDepartmentAgents = new LivechatDepartmentAgents();
