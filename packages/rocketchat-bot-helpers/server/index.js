import _ from 'underscore';

/**
 * BotHelpers helps bots
 * "private" properties use meteor collection cursors, so they stay reactive
 * "public" properties use getters to fetch and filter collections as array
 */
class BotHelpers {
	constructor() {
		this.queries = {
			online: { 'status': { $ne: 'offline' } },
			users: { 'roles': { $not: { $all: ['bot'] } } }
		};
	}

	// setup collection cursors with array of fields from setting
	setupCursors(fieldsSetting) {
		this.userFields = {};
		if (typeof fieldsSetting === 'string') {
			fieldsSetting = fieldsSetting.split(',');
		}
		fieldsSetting.forEach((n) => {
			this.userFields[n.trim()] = 1;
		});
		this._allUsers = RocketChat.models.Users.find(this.queries.users, { fields: this.userFields });
		this._onlineUsers = RocketChat.models.Users.find({ $and: [this.queries.users, this.queries.online] }, { fields: this.userFields });
	}

	// request methods or props as arguments to Meteor.call
	request(prop, ...params) {
		if (typeof this[prop] === 'undefined') {
			return null;
		} else if (typeof this[prop] === 'function') {
			return this[prop](...params);
		} else {
			return this[prop];
		}
	}

	addUserToRole(userName, roleName) {
		Meteor.call('authorization:addUserToRole', roleName, userName);
	}

	removeUserFromRole(userName, roleName) {
		Meteor.call('authorization:removeUserFromRole', roleName, userName);
	}

	addUserToRoom(userName, room) {
		const foundRoom = RocketChat.models.Rooms.findOneByIdOrName(room);

		if (!_.isObject(foundRoom)) {
			throw new Meteor.Error('invalid-channel');
		}

		const data = {};
		data.rid = foundRoom._id;
		data.username = userName;
		Meteor.call('addUserToRoom', data);
	}

	removeUserFromRoom(userName, room) {
		const foundRoom = RocketChat.models.Rooms.findOneByIdOrName(room);

		if (!_.isObject(foundRoom)) {
			throw new Meteor.Error('invalid-channel');
		}
		const data = {};
		data.rid = foundRoom._id;
		data.username = userName;
		Meteor.call('removeUserFromRoom', data);
	}

	// generic error whenever property access insufficient to fill request
	requestError() {
		throw new Meteor.Error('error-not-allowed', 'Bot request not allowed', { method: 'botRequest', action: 'bot_request' });
	}

	// "public" properties accessed by getters
	// allUsers / onlineUsers return whichever properties are enabled by settings
	get allUsers() {
		if (!Object.keys(this.userFields).length) {
			this.requestError();
			return false;
		} else {
			return this._allUsers.fetch();
		}
	}
	get onlineUsers() {
		if (!Object.keys(this.userFields).length) {
			this.requestError();
			return false;
		} else {
			return this._onlineUsers.fetch();
		}
	}
	get allUsernames() {
		if (!this.userFields.hasOwnProperty('username')) {
			this.requestError();
			return false;
		} else {
			return this._allUsers.fetch().map((user) => user.username);
		}
	}
	get onlineUsernames() {
		if (!this.userFields.hasOwnProperty('username')) {
			this.requestError();
			return false;
		} else {
			return this._onlineUsers.fetch().map((user) => user.username);
		}
	}
	get allNames() {
		if (!this.userFields.hasOwnProperty('name')) {
			this.requestError();
			return false;
		} else {
			return this._allUsers.fetch().map((user) => user.name);
		}
	}
	get onlineNames() {
		if (!this.userFields.hasOwnProperty('name')) {
			this.requestError();
			return false;
		} else {
			return this._onlineUsers.fetch().map((user) => user.name);
		}
	}
	get allIDs() {
		if (!this.userFields.hasOwnProperty('_id') || !this.userFields.hasOwnProperty('username')) {
			this.requestError();
			return false;
		} else {
			return this._allUsers.fetch().map((user) => {
				return { 'id': user._id, 'name': user.username };
			});
		}
	}
	get onlineIDs() {
		if (!this.userFields.hasOwnProperty('_id') || !this.userFields.hasOwnProperty('username')) {
			this.requestError();
			return false;
		} else {
			return this._onlineUsers.fetch().map((user) => {
				return { 'id': user._id, 'name': user.username };
			});
		}
	}
}

// add class to meteor methods
const botHelpers = new BotHelpers();

// init cursors with fields setting and update on setting change
RocketChat.settings.get('BotHelpers_userFields', function(settingKey, settingValue) {
	botHelpers.setupCursors(settingValue);
});

Meteor.methods({
	botRequest: (...args) => {
		const userID = Meteor.userId();
		if (userID && RocketChat.authz.hasRole(userID, 'bot')) {
			return botHelpers.request(...args);
		} else {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'botRequest' });
		}
	}
});
