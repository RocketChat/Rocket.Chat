Meteor.startup ->
	instance =
		host: 'localhost'
		port: process.env.PORT

	if process.env.INSTANCE_IP
		instance.host = process.env.INSTANCE_IP

	InstanceStatus.registerInstance('rocket.chat', instance)
	# InstanceStatus.activeLogs()
	UserPresence.start()
	# UserPresence.activeLogs()
	UserPresenceMonitor.start()
