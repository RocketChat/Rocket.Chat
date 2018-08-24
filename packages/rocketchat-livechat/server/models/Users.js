/**
 * Sets an user as (non)operator
 * @param {string} _id - User's _id
 * @param {boolean} operator - Flag to set as operator or not
 */
RocketChat.models.Users.setOperator = function(_id, operator) {
	const update = {
		$set: {
			operator
		}
	};

	return this.update(_id, update);
};

/**
 * Gets all online agents
 * @return
 */
RocketChat.models.Users.findOnlineAgents = function() {
	const query = {
		status: {
			$exists: true,
			$ne: 'offline'
		},
		statusLivechat: 'available',
		roles: 'livechat-agent'
	};

	return this.find(query);
};

/**
 * Find an online agent by his username
 * @return
 */
RocketChat.models.Users.findOneOnlineAgentByUsername = function(username) {
	const query = {
		username,
		status: {
			$exists: true,
			$ne: 'offline'
		},
		statusLivechat: 'available',
		roles: 'livechat-agent'
	};

	return this.findOne(query);
};

/**
 * Gets all agents
 * @return
 */
RocketChat.models.Users.findAgents = function() {
	const query = {
		roles: 'livechat-agent'
	};

	return this.find(query);
};

/**
 * Find online users from a list
 * @param {array} userList - array of usernames
 * @return
 */
RocketChat.models.Users.findOnlineUserFromList = function(userList) {
	const query = {
		status: {
			$exists: true,
			$ne: 'offline'
		},
		statusLivechat: 'available',
		roles: 'livechat-agent',
		username: {
			$in: [].concat(userList)
		}
	};

	return this.find(query);
};

/**
 * Get next user agent in order
 * @return {object} User from db
 */
RocketChat.models.Users.getNextAgent = function() {
	const query = {
		status: {
			$exists: true,
			$ne: 'offline'
		},
		statusLivechat: 'available',
		roles: 'livechat-agent'
	};

	const collectionObj = this.model.rawCollection();
	const findAndModify = Meteor.wrapAsync(collectionObj.findAndModify, collectionObj);

	const sort = {
		livechatCount: 1,
		username: 1
	};

	const update = {
		$inc: {
			livechatCount: 1
		}
	};

	const user = findAndModify(query, sort, update);
	if (user && user.value) {
		return {
			agentId: user.value._id,
			username: user.value.username
		};
	} else {
		return null;
	}
};

/**
 * Change user's livechat status
 * @param {string} token - Visitor token
 */
RocketChat.models.Users.setLivechatStatus = function(userId, status) {
	const query = {
		'_id': userId
	};

	const update = {
		$set: {
			'statusLivechat': status
		}
	};

	return this.update(query, update);
};

/**
 * change all livechat agents livechat status to "not-available"
 */
RocketChat.models.Users.closeOffice = function() {
	self = this;
	self.findAgents().forEach(function(agent) {
		self.setLivechatStatus(agent._id, 'not-available');
	});
};

/**
 * change all livechat agents livechat status to "available"
 */
RocketChat.models.Users.openOffice = function() {
	self = this;
	self.findAgents().forEach(function(agent) {
		self.setLivechatStatus(agent._id, 'available');
	});
};

RocketChat.models.Users.getAgentInfo = function(agentId) {
	const query = {
		_id: agentId
	};

	const options = {
		fields: {
			name: 1,
			username: 1,
			phone: 1,
			customFields: 1
		}
	};

	if (RocketChat.settings.get('Livechat_show_agent_email')) {
		options.fields.emails = 1;
	}

	return this.findOne(query, options);
};
