Asteroid = require 'asteroid'

# TODO:   need to grab these values from process.env[]

_msgsubtopic = 'dashboardRoom'
_msgsublimit = 10   # this is not actually used right now
_messageCollection = 'data.ChatMessage'

# driver specific to Rocketchat hubot integration
# plugs into generic meteorchatbotadapter

class RocketchatDriver
  constructor: (url, @logger) ->
    @asteroid = new Asteroid(url)

  joinRoom: (userid, roomid) =>
    @logger.info "joined room"
    @asteroid.call('addUserToRoom', {uid:userid, rid:roomid})

  sendMessage: (text, roomid) =>
    @logger.info "send message"
    @asteroid.call('sendMessage', {message: text, rid: roomid})

  login: (username, password) =>
    # promise returned
    return @asteroid.loginWithPassword username, password

  prepMeteorSubscriptions: (data) =>
    # use data to cater for param differences - until we learn more
    #    data.uid
    #    data.roomid
    # return promise
    @logger.info "prepare meteor subscriptions"
    @joinRoom data.uid, data.roomid
    msgsub = @asteroid.subscribe _msgsubtopic, data.roomid, _msgsublimit
    return msgsub.ready

  setupReactiveMessageList: (receiveMessageCallback) =>
    @logger.info "setup reactive message list"
    @messages = @asteroid.getCollection "data.ChatMessage"
    rQ = @messages.reactiveQuery {}
    rQ.on "change", (id) =>
      # awkward syntax due to asteroid limitations
      # - it ain't no minimongo cursor
      @logger.info "change received"
      changedMsgQuery = @messages.reactiveQuery {"_id": id}
      if changedMsgQuery.result
        changedMsg = changedMsgQuery.result[0]
        if changedMsg and changedMsg.msg
          receiveMessageCallback  changedMsg

module.exports = RocketchatDriver

