# Remove runtime settings (non-persistent)
Meteor.startup ->
	RocketChat.models.Settings.remove({ ts: { $lt: RocketChat.settings.ts } })

