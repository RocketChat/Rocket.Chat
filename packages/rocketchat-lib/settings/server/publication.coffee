Meteor.publish 'settings', ->
	console.log '[publish] settings'.green
	return Settings.find { public: true }, { fields: _id: 1, value: 1 }

Meteor.publish 'admin-settings', ->
	console.log '[publish] admin-settings'.green

	unless @userId
		return @ready()

	if RocketChat.authz.hasPermission( @userId, 'view-privileged-setting')
		return Settings.find()
	else
		return @ready()

