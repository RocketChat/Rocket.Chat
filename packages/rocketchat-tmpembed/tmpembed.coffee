###
# ObjEmbedder is a temporary image and map embedder for bots development
# @param {Object} msg - The message object
# to be replaced by proper implementation in 1.0
###

class ObjEmbedder
	constructor: (message) ->
		console.log "ObjEmbedder constructor" if window.rocketDebug

		if _.trim message.msg
			console.log "ObjEmbedder trim" if window.rocketDebug

			picmatch = message.msg.match(/^https?:\/\/(?:[a-z0-9\-]+\.)+[a-z0-9]{2,6}(?:\/[^\/#?]+)+\.(?:jpe?g|gif|png)$/i)
			if picmatch?
				# inline style to limit code pollution
				console.log "ObjEmbedder picmatch" if window.rocketDebug
				message.html = "<img style='width:400px;height:auto;' src='" + message.msg + "'></img>"

			else
				mapmatch = message.msg.match(/^https?\:\/\/maps\.(google|googleapis)\.[a-z]+\/maps\/api.*format=png$/i)
				if mapmatch?
					console.log "ObjEmbedder mapmatch" if window.rocketDebug
					message.html = "<img style='width:400px;height:auto;' src='" + message.msg + "'></img>"

			# end of temporary pre-1.0 image embed
		return message

RocketChat.callbacks.add 'renderMessage', ObjEmbedder, RocketChat.callbacks.priority.HIGH
