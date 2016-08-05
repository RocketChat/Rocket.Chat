###
# MapView is a named function that will replace geolocation in messages with mapview
# @param {Object} message - The message object
###

class MapView
	constructor: (message) ->
		
		if _.trim message.html
			
			MapViewEnabled = RocketChat.settings.get 'MapView_Enabled'
			
			if MapViewEnabled
			
				latLngPattern = /// ^ # begin of line
				   \(maps:      	  # define hardcoded maps tag
				   (-*[0-9]+.[0-9]+)  # match latitude
				   ,                  # literal comma
				   (-*[0-9]+.[0-9]+)  # match longitude
				   \)			      # end maps tag
				   $ ///i             # EOL
				
				match = latLngPattern.exec message.html
				
				gMapsAPIKey = RocketChat.settings.get 'MapView_GMapsAPIKey'
				
				if match
					message.html  = '<a href="https://www.google.com/maps/preview/@'+match[1]+','+match[2]+',14z"><img src="https://maps.googleapis.com/maps/api/staticmap?zoom=14&size=450x200&markers=color:gray%7Clabel:%7C'+match[1]+','+match[2]+'&key='+gMapsAPIKey+'" /></a>'
					
		return message

RocketChat.callbacks.add 'renderMessage', MapView, RocketChat.callbacks.priority.HIGH
