# Remove runtime settings (non-persistent)
Meteor.startup ->
	RocketChat.models.Settings.update({ ts: { $lt: RocketChat.settings.ts } }, { $set: { hidden: true } })

