###
# MapView is a named function that will replace geolocation in messages with mapview
# @param {Object} message - The message object
###

class MapView
	constructor: (message) ->
		
		if _.trim message.html
			
			console.log(message.html)
			
			latLngPattern = /// ^ # begin of line
			   \(maps:      	  # define hardcoded maps tag
			   (-*[0-9]+.[0-9]+)  # match latitude
			   ,                  # literal comma
			   (-*[0-9]+.[0-9]+)  # match longitude
			   \)			      # end maps tag
			   $ ///i             # EOL
			
			match = latLngPattern.exec message.html
			
			if match
				
				console.log(match)
			   
			   #message.html = "https://www.google.com/maps/preview/@<latitude>,<longitude>,<zoom level>z"
			   
			   
		return message

RocketChat.callbacks.add 'renderMessage', MapView
