Meteor.startup ->
	InstanceStatus.registerInstance('rocket.chat', {port: process.env.PORT})
	# InstanceStatus.activeLogs()
	UserPresence.start()
	# UserPresence.activeLogs()
	UserPresenceMonitor.start()
