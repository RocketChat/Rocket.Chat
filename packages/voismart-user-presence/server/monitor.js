/* globals UserPresenceMonitor, UsersSessions */

UserPresenceMonitor = {
	callbacks: [],

	/**
	 * The callback will receive the following parameters: user, status, statusConnection
	 */
	onSetUserStatus: function(callback) {
		this.callbacks.push(callback);
	},

	runCallbacks: function(user, status, statusConnection) {
		this.callbacks.forEach(function(callback) {
			callback.call(null, user, status, statusConnection);
		});
	},

	start: function() {
		UsersSessions.find({}).observe({
			added: function(record) {
				UserPresenceMonitor.processUserSession(record, 'added');
			},
			changed: function(record) {
				UserPresenceMonitor.processUserSession(record, 'changed');
			},
			removed: function(record) {
				UserPresenceMonitor.processUserSession(record, 'removed');
			}
		});
	},

	processUserSession: function(record, action) {
		if (action === 'removed' && (record.connections == null || record.connections.length === 0)) {
			return;
		}

		if (record.connections == null || record.connections.length === 0 || action === 'removed') {
			if (record.visitor === true) {
				UserPresenceMonitor.setVisitorStatus(record._id, 'offline');
			} else {
				UserPresenceMonitor.setUserStatus(record._id, 'offline');
			}

			if (action !== 'removed') {
				UsersSessions.remove({_id: record._id, 'connections.0': {$exists: false} });
			}
			return;
		}

		var connectionStatus = 'offline';
		record.connections.forEach(function(connection) {
			if (connection.status === 'online') {
				connectionStatus = 'online';
			} else if (connection.status === 'away' && connectionStatus === 'offline') {
				connectionStatus = 'away';
			}
		});

		if (record.visitor === true) {
			UserPresenceMonitor.setVisitorStatus(record._id, connectionStatus);
		} else {
			UserPresenceMonitor.setUserStatus(record._id, connectionStatus);
		}
	},

	processUser: function(id, fields) {
		if (fields.statusDefault == null) {
			return;
		}

		var userSession = UsersSessions.findOne({_id: id});

		if (userSession) {
			UserPresenceMonitor.processUserSession(userSession, 'changed');
		}
	},

	setUserStatus: function(userId, status) {
		var user = Meteor.users.findOne(userId),
			statusConnection = status;

		if (!user) {
			return;
		}

		if (user.statusDefault != null && status !== 'offline' && user.statusDefault !== 'online') {
			status = user.statusDefault;
		}

		var query = {
			_id: userId,
			$or: [
				{status: {$ne: status}},
				{statusConnection: {$ne: statusConnection}}
			]
		};

		var update = {
			$set: {
				status: status,
				statusConnection: statusConnection
			}
		};

		Meteor.users.update(query, update);

		this.runCallbacks(user, status, statusConnection);
	},

	setVisitorStatus: function(/*id, status*/) {}
};
