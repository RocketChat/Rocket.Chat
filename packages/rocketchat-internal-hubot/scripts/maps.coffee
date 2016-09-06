# Description:
#   Interacts with the Google Maps API.
#
# Commands:
#   hubot map me <query> - Returns a map view of the area returned by `query`.

module.exports = (robot) ->

  robot.respond /(?:(satellite|terrain|hybrid)[- ])?map me (.+)/i, (msg) ->
    mapType  = msg.match[1] or "roadmap"
    location = msg.match[2]
    mapUrl   = "http://maps.google.com/maps/api/staticmap?markers=" +
                escape(location) +
                "&size=400x400&maptype=" +
                mapType +
                "&sensor=false" +
                "&format=png" # So campfire knows it's an image
    url      = "http://maps.google.com/maps?q=" +
               escape(location) +
              "&hl=en&sll=37.0625,-95.677068&sspn=73.579623,100.371094&vpsrc=0&hnear=" +
              escape(location) +
              "&t=m&z=11"

    msg.send mapUrl
    msg.send url
