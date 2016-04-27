Meteor.methods
	saveUserPreferences: (settings) ->
		if Meteor.userId()
			preferences = {}

			if settings.language?
				RocketChat.models.Users.setLanguage Meteor.userId(), settings.language

			if settings.newRoomNotification?
				preferences.newRoomNotification = if settings.newRoomNotification is "1" then true else false

			if settings.newMessageNotification?
				preferences.newMessageNotification = if settings.newMessageNotification is "1" then true else false

			if settings.useEmojis?
				preferences.useEmojis = if settings.useEmojis is "1" then true else false

			if settings.convertAsciiEmoji?
				preferences.convertAsciiEmoji = if settings.convertAsciiEmoji is "1" then true else false

			if settings.saveMobileBandwidth?
				preferences.saveMobileBandwidth = if settings.saveMobileBandwidth is "1" then true else false

			if settings.collapseMediaByDefault?
				preferences.collapseMediaByDefault = if settings.collapseMediaByDefault is "1" then true else false

			if settings.compactView?
				preferences.compactView = if settings.compactView is "1" then true else false

			if settings.unreadRoomsMode?
				preferences.unreadRoomsMode = if settings.unreadRoomsMode is "1" then true else false

			if settings.autoImageLoad?
				preferences.autoImageLoad = if settings.autoImageLoad is "1" then true else false

			if settings.emailNotificationMode?
				preferences.emailNotificationMode = settings.emailNotificationMode

			preferences.highlights = settings.highlights

			RocketChat.models.Users.setPreferences Meteor.userId(), preferences

			return true
