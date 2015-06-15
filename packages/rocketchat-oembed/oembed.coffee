###
# OEmbed is a temporary image and map embedder for bots development
# @param {Object} msg - The message object
# to be replaced by proper implementation in 1.0
###

# IframelyOembed.setEndpoint 'http://open.iframe.ly/api/oembed?api_key=' + Meteor.settings.public?.iframelyApiKey?
IframelyOembed.setCacheOptions
	cacheTTL: 1000 * 60 * 60, # Hour.
	cacheErrorTTL: 1000 * 60, # Minute.
	cacheEnabled: true

class OEmbed
	constructor: (message) ->
		console.log "OEmbed constructor" if window.rocketDebug

		message.urls?.forEach (url) ->
			console.log "OEmbed iframely.oembed", url if window.rocketDebug
			Meteor.call 'iframely.oembed', url, (error, data) =>
				console.log "OEmbed iframely.oembed callback", error, data if window.rocketDebug
				if _.trim data.html
					message.html = message.html + data.html

		# if _.trim message.msg

		# 	picmatch = message.msg.match(/^https?:\/\/(?:[a-z0-9\-]+\.)+[a-z0-9]{2,6}(?:\/[^\/#?]+)+\.(?:jpe?g|gif|png)$/i)
		# 	if picmatch?
		# 		# inline style to limit code pollution
		# 		console.log "OEmbed picmatch" if window.rocketDebug
		# 		message.html = "<img style='width:400px;height:auto;' src='" + message.msg + "'></img>"

		# 	else
		# 		mapmatch = message.msg.match(/^https?\:\/\/maps\.(google|googleapis)\.[a-z]+\/maps\/api.*format=png$/i)
		# 		if mapmatch?
		# 			console.log "OEmbed mapmatch" if window.rocketDebug
		# 			message.html = "<img style='width:400px;height:auto;' src='" + message.msg + "'></img>"

		return message


# RocketChat.callbacks.add 'renderMessage', OEmbed, RocketChat.callbacks.priority.HIGH
