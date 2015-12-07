Meteor.methods
	saveUserPreferences: (settings) ->
		console.log '[method] saveUserPreferences', settings

		if Meteor.userId()
			preferences = {}

			if settings.disableNewRoomNotification?
				preferences.disableNewRoomNotification = if settings.disableNewRoomNotification is "1" then true else false

			if settings.disableNewMessageNotification?
				preferences.disableNewMessageNotification = if settings.disableNewMessageNotification is "1" then true else false

			if settings.useEmojis?
				preferences.useEmojis = if settings.useEmojis is "1" then true else false

			if settings.convertAsciiEmoji?
				preferences.convertAsciiEmoji = if settings.convertAsciiEmoji is "1" then true else false

			if settings.saveMobileBandwidth?
				preferences.saveMobileBandwidth = if settings.saveMobileBandwidth is "1" then true else false

			if settings.compactView?
				preferences.compactView = if settings.compactView is "1" then true else false

			if settings.unreadRoomsMode?
				preferences.unreadRoomsMode = if settings.unreadRoomsMode is "1" then true else false

			if settings.autoImageLoad?
				preferences.autoImageLoad = if settings.autoImageLoad is "1" then true else false

			RocketChat.models.Users.setPreferences Meteor.userId(), preferences

			return true
