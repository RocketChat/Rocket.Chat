import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import broker from '../../services';

// capture log in event
Accounts.onLogin(async(login) => {
	login.connection.presenceUserId = login.user._id;
	await broker.call('presence.newConnection', {
		userId: login.user._id,
		connection: login.connection,
	});
});

// capture browser close/refresh event
Meteor.onConnection((connection) => {
	connection.onClose(async() => {
		// mark connection as closed so if it drops in the middle of the process it is not even created
		connection.closed = true;

		if (connection.presenceUserId !== undefined && connection.presenceUserId !== null) {
			broker.call('presence.removeConnection', {
				userId: connection.presenceUserId,
				connectionId: connection.id,
			});
		}
	});
});

// capture log out event
Meteor.publish(null, function() {
	if (this.userId == null && this.connection.presenceUserId !== undefined && this.connection.presenceUserId !== null) {
		broker.call('presence.removeConnection', {
			userId: this.connection.presenceUserId,
			connectionId: this.connection.id,
		});
		delete this.connection.presenceUserId;
	}

	this.ready();
});
