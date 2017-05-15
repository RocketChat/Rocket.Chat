/* globals InstanceStatus, UserPresence, UserPresenceMonitor */

Meteor.startup(function() {
	const instance = {
		host: 'localhost',
		port: process.env.PORT
	};

	if (process.env.INSTANCE_IP) {
		instance.host = process.env.INSTANCE_IP;
	}

	InstanceStatus.registerInstance('rocket.chat', instance);

	UserPresence.start();

	return UserPresenceMonitor.start();
});
