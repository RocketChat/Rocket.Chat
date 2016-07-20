
// config to extend query / return attributes
const defaults = {
	userFields: {
		_id: 1,
		name: 1,
		username: 1,
		status: 1,
		emails: 1,
		language: 1
	},
	onlineQuery: { 'status': { $ne: 'offline' } },
	userQuery: { 'roles': { $not: { $all: ['bot'] } } }
};

/**
 * BotHelper helps bots
 * keeping Rocket.chat stuff in meteor package allows clean logic separation in bot scripts
 * "private" properties use meteor collection cursors, so they stay reactive
 * "public" "properties" use getters to fetch and filter collections as array
 */
class BotHelper {
	constructor(options = {}) {
		this.config = _.extend({}, defaults, options);
		this._allUsers = Meteor.users.find(this.config.userQuery, { fields: this.config.userFields });
		this._onlineUsers = Meteor.users.find({ $and: [this.config.userQuery, this.config.onlineQuery] }, { fields: this.config.userFields });
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

// add class to meteor methods (BotHelper accepts options)
// TODO: Let constructor options be passed in through another method (to override defaults)
const botHelper = new BotHelper();
Meteor.methods({
	botRequest: (...args) => botHelper.request(...args)
});
