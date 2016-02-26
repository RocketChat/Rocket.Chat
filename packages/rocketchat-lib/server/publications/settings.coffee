Meteor.publish 'settings', (ids = []) ->
	return RocketChat.models.Settings.findNotHiddenPublic(ids)

Meteor.publish 'admin-settings', ->
	unless @userId
		return @ready()

	if RocketChat.authz.hasPermission( @userId, 'view-privileged-setting')
		return RocketChat.models.Settings.findNotHidden()
	else
		return @ready()

