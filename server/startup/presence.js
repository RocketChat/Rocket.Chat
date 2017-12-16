/* globals InstanceStatus, UserPresence, UserPresenceMonitor */

Meteor.startup(function() {
	const instance = {
		host: 'localhost',
		port: String(process.env.PORT).trim()
	};

	if (process.env.INSTANCE_IP) {
		instance.host = String(process.env.INSTANCE_IP).trim();
	}

	InstanceStatus.registerInstance('rocket.chat', instance);

	UserPresence.start();

	return UserPresenceMonitor.start();
});
