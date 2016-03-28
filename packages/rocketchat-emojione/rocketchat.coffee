# RocketChat.emoji should be set to an object representing the emoji package used
RocketChat.emoji = emojione

RocketChat.emoji.imageType = 'png';
RocketChat.emoji.sprites = true;

# RocketChat.emoji.list is the collection of emojis
RocketChat.emoji.list = emojione.emojioneList

# RocketChat.emoji.class is the name of the registered class for emojis
RocketChat.emoji.class = 'Emojione'

# Additional settings -- ascii emojis
Meteor.startup ->
	Tracker.autorun ->
		emojione?.ascii = if Meteor.user()?.settings?.preferences?.convertAsciiEmoji? then Meteor.user().settings.preferences.convertAsciiEmoji else true
