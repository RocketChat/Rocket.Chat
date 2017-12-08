import _ from 'underscore';
import s from 'underscore.string';
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
 * Gets visitor by token
 * @param {string} token - Visitor token
 */
RocketChat.models.Users.getVisitorByToken = function(token, options) {
	const query = {
		'profile.guest': true,
		'profile.token': token
	};

	return this.findOne(query, options);
};

/**
 * Gets visitor by token
 * @param {string} token - Visitor token
 */
RocketChat.models.Users.findVisitorByToken = function(token) {
	const query = {
		'profile.guest': true,
		'profile.token': token
	};

	return this.find(query);
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

RocketChat.models.Users.updateLivechatDataByToken = function(token, key, value, overwrite = true) {
	const query = {
		'profile.token': token
	};

	if (!overwrite) {
		const user = this.findOne(query, { fields: { livechatData: 1 } });
		if (user.livechatData && typeof user.livechatData[key] !== 'undefined') {
			return true;
		}
	}

	const update = {
		$set: {
			[`livechatData.${ key }`]: value
		}
	};

	return this.update(query, update);
};

/**
 * Find a visitor by their phone number
 * @return {object} User from db
 */
RocketChat.models.Users.findOneVisitorByPhone = function(phone) {
	const query = {
		'phone.phoneNumber': phone
	};

	return this.findOne(query);
};

/**
 * Get the next visitor name
 * @return {string} The next visitor name
 */
RocketChat.models.Users.getNextVisitorUsername = function() {
	const settingsRaw = RocketChat.models.Settings.model.rawCollection();
	const findAndModify = Meteor.wrapAsync(settingsRaw.findAndModify, settingsRaw);

	const query = {
		_id: 'Livechat_guest_count'
	};

	const update = {
		$inc: {
			value: 1
		}
	};

	const livechatCount = findAndModify(query, null, update);

	return `guest-${ livechatCount.value.value + 1 }`;
};

RocketChat.models.Users.saveGuestById = function(_id, data) {
	const setData = {};
	const unsetData = {};

	if (data.name) {
		if (!_.isEmpty(s.trim(data.name))) {
			setData.name = s.trim(data.name);
		} else {
			unsetData.name = 1;
		}
	}

	if (data.email) {
		if (!_.isEmpty(s.trim(data.email))) {
			setData.visitorEmails = [
				{ address: s.trim(data.email) }
			];
		} else {
			unsetData.visitorEmails = 1;
		}
	}

	if (data.phone) {
		if (!_.isEmpty(s.trim(data.phone))) {
			setData.phone = [
				{ phoneNumber: s.trim(data.phone) }
			];
		} else {
			unsetData.phone = 1;
		}
	}

	const update = {};

	if (!_.isEmpty(setData)) {
		update.$set = setData;
	}

	if (!_.isEmpty(unsetData)) {
		update.$unset = unsetData;
	}

	if (_.isEmpty(update)) {
		return true;
	}

	return this.update({ _id }, update);
};

RocketChat.models.Users.findOneGuestByEmailAddress = function(emailAddress) {
	const query = {
		'visitorEmails.address': new RegExp(`^${ s.escapeRegExp(emailAddress) }$`, 'i')
	};

	return this.findOne(query);
};

RocketChat.models.Users.getAgentInfo = function(agentId) {
	const query = {
		_id: agentId
	};

	const options = {
		fields: {
			name: 1,
			username: 1,
			emails: 1,
			customFields: 1
		}
	};

	return this.findOne(query, options);
};
