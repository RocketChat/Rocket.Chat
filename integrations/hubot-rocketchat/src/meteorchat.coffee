{Adapter, TextMessage} = require "../../hubot2/node_modules/hubot"
Chatdriver = require './rocketchat_driver'

# TODO:   need to grab these values from process.env[]
#
_meteorurl = "localhost:3000"
_hubotuser = "hubot@hubot.com"
_hubotpassword = "abc123"


# TODO:  how to parameterize room(s) will depend on the
#        operating mode and policies
#
#        don't be too opinioned as it will prevent certain
#        yet-to-be-imagined usecases

_roomid = "TZCibR4JM3btXjJHg"


# Generic hubot adapter for chat subsystems based on Meteor
#
# support for :  rocketchat, spacetalk, nullchat planned
# more to follow possibly
#

class MeteorChatBotAdapter extends Adapter
  send: (envelope, strings...) =>
    @robot.logger.info "send msg"
    @chatdriver.sendMessage(str, envelope.room)  for str in strings

  reply: (envelope, strings...) =>
    @robot.logger.info "reply"
    strings = strings.map (s) -> "#{envelope.user.name}: #{s}"
    @send envelope, strings...

  run: =>
    @robot.logger.info "running rocketchat"
    @chatdriver = new Chatdriver _meteorurl, @robot.logger
    @chatdriver.login _hubotuser, _hubotpassword
    .then (userid) =>
      @robot.logger.info "logged in"
      @chatdriver.joinRoom userid, _roomid
      @chatdriver.prepMeteorSubscriptions({uid: userid, roomid: _roomid})
      .then (arg) =>
        @robot.logger.info "subscription ready"

        @chatdriver.setupReactiveMessageList (newmsg) =>
          @robot.logger.info "message receive callback"
          user = @robot.brain.userForId 1, name: 'Shell', room: newmsg.rid
          text = new TextMessage(user, newmsg.msg, newmsg._id)
          @receive text
    @emit 'connected'

exports.use = (robot) ->
  new MeteorChatBotAdapter robot
