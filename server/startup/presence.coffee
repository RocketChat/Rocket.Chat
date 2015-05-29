Meteor.startup ->
	InstanceStatus.registerInstance('rocket.chat')
	# InstanceStatus.activeLogs()
	UserPresence.start()
	# UserPresence.activeLogs()
	UserPresenceMonitor.start()
