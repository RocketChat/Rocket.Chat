import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import broker from '../../services';

// capture log in event
Accounts.onLogin(async(login) => {
	login.connection.presenceUserId = login.user._id;
	const result = await broker.call('presence.newConnection', {
		userId: login.user._id,
		connection: login.connection,
	});

	console.log('Accounts.onLogin ->', result);
});

// capture browser close/refresh event
Meteor.onConnection((connection) => {
	connection.onClose(async() => {
		// mark connection as closed so if it drops in the middle of the process it is not even created
		connection.closed = true;

		if (connection.presenceUserId !== undefined && connection.presenceUserId !== null) {
			const result = await broker.call('presence.removeConnection', {
				connectionId: connection.id,
			});

			console.log('result ->', result);
		}
	});
});

// capture log out event
Meteor.publish(null, function() {
	if (this.userId == null && this.connection.presenceUserId !== undefined && this.connection.presenceUserId !== null) {
		broker.call('presence.removeConnection', {
			connectionId: this.connection.id,
		});
		delete this.connection.presenceUserId;
	}

	this.ready();
});
