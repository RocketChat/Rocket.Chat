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
		var agents = [].concat(agents);

		var record = {
			enabled: enabled,
			name: name,
			description: description,
			numAgents: agents.count()
		};

		// if (agents.length > 0) {
		// 	for (agent of agents) {
		// 		record.agents.push({ _id: agent._id, username: agent.username });
		// 	}
		// }

		_.extend(record, extraData);

		if (_id) {
			this.update({ _id: _id }, { $set: record });
		} else {
			_id = this.insert(record);
		}

		agents.forEach((agent) => {
			agent.departmentId = _id;

			RocketChat.models.LivechatDepartmentAgents.saveAgent(agent);
		});

		// this.upsert({ _id: _id }, { $set: record });
		return _.extend(record, { _id: _id });
	}

	// REMOVE
	removeById(_id) {
		query = { _id: _id };
		return this.remove(query);
	}

	getNextAgent(departmentId) {

		var department = this.findOne({ _id: departmentId }, { fields: { agents: 1 } })

		if (!department || !department.agents || department.agents.length === 0) {
			return;
		}

		var onlineUsers = RocketChat.models.Users.findOnlineUserFromList(_.pluck(department.agents, 'username'));

		var onlineUsernames = _.pluck(onlineUsers.fetch(), 'username');

		console.log('onlineUsernames ->',onlineUsernames);

		var query = {
			_id: departmentId,
			"agents.username": {
				$in: onlineUsernames
			}
		};

		var sort = {
			livechatCount: 1,
			// sort: 1,
			username: 1
		};
		var update = {
			$inc: {
				"agents.$.livechatCount": 1
			}
		};

		// var query = {
		// 	status: 'online'
		// };

		// query['roles.' + Roles.GLOBAL_GROUP] = 'livechat-agent';

		var collectionObj = this.model.rawCollection();
		var findAndModify = Meteor.wrapAsync(collectionObj.findAndModify, collectionObj);

		// var sort = {
		// 	livechatCount: 1,
		// 	username: 1
		// };

		// var update = {
		// 	$inc: {
		// 		livechatCount: 1
		// 	}
		// };

		return findAndModify(query, sort, update);
		// return RocketChat.models.Users.getNextAgent(department.agents);
	}
}

RocketChat.models.LivechatDepartment = new LivechatDepartment();
