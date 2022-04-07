import './settings';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { Users, Rooms } from '../../models/server';
import { settings } from '../../settings/server';
import { hasRole } from '../../authorization/server';

/**
 * BotHelpers helps bots
 * "private" properties use meteor collection cursors, so they stay reactive
 * "public" properties use getters to fetch and filter collections as array
 */
class BotHelpers {
	constructor() {
		this.queries = {
			online: { status: { $ne: 'offline' } },
			users: { roles: { $not: { $all: ['bot'] } } },
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
		this._allUsers = Users.find(this.queries.users, { fields: this.userFields });
		this._onlineUsers = Users.find({ $and: [this.queries.users, this.queries.online] }, { fields: this.userFields });
	}

	// request methods or props as arguments to Meteor.call
	request(prop, ...params) {
		if (typeof this[prop] === 'undefined') {
			return null;
		}
		if (typeof this[prop] === 'function') {
			return this[prop](...params);
		}
		return this[prop];
	}

	addUserToRole(userName, roleId) {
		Meteor.call('authorization:addUserToRole', roleId, userName);
	}

	removeUserFromRole(userName, roleId) {
		Meteor.call('authorization:removeUserFromRole', roleId, userName);
	}

	addUserToRoom(userName, room) {
		const foundRoom = Rooms.findOneByIdOrName(room);

		if (!_.isObject(foundRoom)) {
			throw new Meteor.Error('invalid-channel');
		}

		const data = {};
		data.rid = foundRoom._id;
		data.username = userName;
		Meteor.call('addUserToRoom', data);
	}

	removeUserFromRoom(userName, room) {
		const foundRoom = Rooms.findOneByIdOrName(room);

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
		throw new Meteor.Error('error-not-allowed', 'Bot request not allowed', {
			method: 'botRequest',
			action: 'bot_request',
		});
	}

	// "public" properties accessed by getters
	// allUsers / onlineUsers return whichever properties are enabled by settings
	get allUsers() {
		if (!Object.keys(this.userFields).length) {
			this.requestError();
			return false;
		}
		return this._allUsers.fetch();
	}

	get onlineUsers() {
		if (!Object.keys(this.userFields).length) {
			this.requestError();
			return false;
		}
		return this._onlineUsers.fetch();
	}

	get allUsernames() {
		if (!this.userFields.hasOwnProperty('username')) {
			this.requestError();
			return false;
		}
		return this._allUsers.fetch().map((user) => user.username);
	}

	get onlineUsernames() {
		if (!this.userFields.hasOwnProperty('username')) {
			this.requestError();
			return false;
		}
		return this._onlineUsers.fetch().map((user) => user.username);
	}

	get allNames() {
		if (!this.userFields.hasOwnProperty('name')) {
			this.requestError();
			return false;
		}
		return this._allUsers.fetch().map((user) => user.name);
	}

	get onlineNames() {
		if (!this.userFields.hasOwnProperty('name')) {
			this.requestError();
			return false;
		}
		return this._onlineUsers.fetch().map((user) => user.name);
	}

	get allIDs() {
		if (!this.userFields.hasOwnProperty('_id') || !this.userFields.hasOwnProperty('username')) {
			this.requestError();
			return false;
		}
		return this._allUsers.fetch().map((user) => ({ id: user._id, name: user.username }));
	}

	get onlineIDs() {
		if (!this.userFields.hasOwnProperty('_id') || !this.userFields.hasOwnProperty('username')) {
			this.requestError();
			return false;
		}
		return this._onlineUsers.fetch().map((user) => ({ id: user._id, name: user.username }));
	}
}

// add class to meteor methods
const botHelpers = new BotHelpers();

// init cursors with fields setting and update on setting change
settings.watch('BotHelpers_userFields', function (settingValue) {
	botHelpers.setupCursors(settingValue);
});

Meteor.methods({
	botRequest: (...args) => {
		const userID = Meteor.userId();
		if (userID && hasRole(userID, 'bot')) {
			return botHelpers.request(...args);
		}
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'botRequest' });
	},
});
