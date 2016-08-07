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
		this.setupCursors();
	}

	// Setup collection cursors in method to be reset when settings change
	setupCursors() {
		let csv = String(RocketChat.settings.get('BotHelpers_userFields'));
		this.userFields = {};
		String(csv).split(',').forEach((n) => {
			this.userFields[n.trim()] = 1;
		});
		this._allUsers = Meteor.users.find(this.queries.users, { fields: this.userFields });
		this._onlineUsers = Meteor.users.find({ $and: [this.queries.users, this.queries.online] }, { fields: this.userFields });
	}

	// request methods or props as arguments to Meteor.call
	request(prop) {
		if (typeof this[prop] === 'undefined') {
			return null;
		} else if (typeof this[prop] === 'function') {
			return this[prop]();
		} else {
			return this[prop];
		}
	}

	// "public" properties accessed by getters
	get allUsers() {
		return this._allUsers.fetch();
	}
	get onlineUsers() {
		return this._onlineUsers.fetch();
	}
	get allUsernames() {
		return this._allUsers.fetch().map((user) => user.username);
	}
	get onlineUsernames() {
		return this._onlineUsers.fetch().map((user) => user.username);
	}
	get allNames() {
		return this._allUsers.fetch().map((user) => user.name);
	}
	get onlineNames() {
		return this._onlineUsers.fetch().map((user) => user.name);
	}
	get allIDs() {
		return this._allUsers.fetch().map((user) => {
			return { 'id': user._id, 'name': user.username };
		});
	}
	get onlineIDs() {
		return this._onlineUsers.fetch().map((user) => {
			return { 'id': user._id, 'name': user.username };
		});
	}
}

// add class to meteor methods
const botHelpers = new BotHelpers();
Meteor.methods({
	botRequest: (...args) => {
		let userID = Meteor.userId();
		if (userID && RocketChat.authz.hasRole(userID, 'bot')) {
			return botHelpers.request(...args);
		} else {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'botHelpers' });
		}
	}
});
