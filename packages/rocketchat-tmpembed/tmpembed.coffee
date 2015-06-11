###
# ObjEmbedder is a temporary image and map embedder for bots development
# @param {Object} msg - The message object
# to be replaced by proper implementation in 1.0
###

class ObjEmbedder
  constructor: (message) ->
    console.log "in obj embedded"
    if _.trim message.html
      console.log("trim okay")
      # temporary pre-1.0 image embed to support bot development - to be refactored
      msg = message.html
      picmatch = msg.match(/^https?:\/\/(?:[a-z0-9\-]+\.)+[a-z0-9]{2,6}(?:\/[^\/#?]+)+\.(?:jpe?g|gif|png)$/i)

      if picmatch?
        # inline style to limit code pollution
        console.log("match pic")
        msg = "<img style='width:400px;height:auto;' src='" + msg + "'></img>"
        return msg

      mapmatch = msg.match(/^https?\:\/\/maps\.(google|googleapis)\.[a-z]+\/maps\/api.*format=png$/i)
      if mapmatch?
        console.log("match map")
        msg = "<img style='width:400px;height:auto;' src='" + msg + "'></img>"
        return msg

      # end of temporary pre-1.0 image embed
    return message

RocketChat.callbacks.add 'renderMessage', ObjEmbedder, RocketChat.callbacks.priority.HIGH
