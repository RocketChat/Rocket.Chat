const Api = new Restivus({
  useDefaultAuth: true,
  apiPath: 'api/lg/',
  prettyJson: true,
  enableCors: false,
})

function errorResponse(error, statusCode = 500) {
  return {
    statusCode,
    body: {
      status: 'fail',
      message: `${error.name}::${error.message}`
    },
  }
}

function successResponse(data, statusCode = 200) {
  return {
    statusCode,
    body: Object.assign({}, {
      status: 'success',
    }, data)
  }
}

const validRoomName = new RegExp('^[0-9a-zA-Z-_.]+$', 'i')

Api.addRoute('rooms', {authRequired: true}, {
  post() {
    try {
      const {
        userId,
        bodyParams: {
          name,
          topic,
          members,
        },
      } = this
      if (!RocketChat.authz.hasPermission(userId, 'create-c')) {
        throw new Meteor.Error('insufficient-permissions', 'you do not have permission to do this')
      }
      if (!validRoomName.test(name)) {
        throw new Meteor.Error('invalid-room-name', `${name} is not a valid room name`)
      }
      /* eslint-disable prefer-arrow-callback */
      const result = Meteor.runAsUser(userId, function () {
        const {rid} = Meteor.call('createChannel', name, members)
        const user = RocketChat.models.Users.findOneById(userId)
        RocketChat.saveRoomTopic(rid, topic, user)
        return {
          status: 'success',
          room: {
            rid,
            name,
            topic,
            members,
          },
        }
      })
      return successResponse({result})
    } catch (err) {
      console.error(err.stack)
      RavenLogger.log(err)
      return errorResponse(err)
    }
  },
})

Api.addRoute('rooms/:name/join', {authRequired: true}, {
  post() {
    try {
      const {
        userId,
        bodyParams: {
          members,
        },
        urlParams: {name},
      } = this

      if (!RocketChat.authz.hasPermission(userId, 'add-user-to-room')) {
        throw new Meteor.Error('insufficient-permissions', 'you do not have permission to do this')
      }
      /* eslint-disable prefer-arrow-callback */
      const room = Meteor.runAsUser(this.userId, () => {
        return RocketChat.models.Rooms.findOneByName(name)
      })
      if (!room) {
        throw new Meteor.Error('error-invalid-room', `there is no room named ${name}`)
      }
      const usersJoined = []
      const alreadyInRoom = []
      members.forEach(username => {
        const rcUser = RocketChat.models.Users.findOneByUsername(username)
        if (!rcUser) {
          throw new Meteor.Error('error-invalid-username', `there is no user named ${username}`)
        }
        Meteor.runAsUser(rcUser._id, () => {
          Meteor.call('joinRoom', room._id, (err, joined) => {
            if (err) {
              throw err
            }
            if (joined) {
              usersJoined.push(username)
            } else {
              alreadyInRoom.push(username)
            }
          })
        })
      })
      return successResponse({result: {room: name, usersJoined, alreadyInRoom}})
    } catch (err) {
      console.error(err.stack)
      RavenLogger.log(err)
      return errorResponse(err)
    }
  }
})

Api.addRoute('rooms/:name/send', {authRequired: true}, {
  post() {
    try {
      const {
        userId,
        bodyParams: {msg},
        urlParams: {name},
      } = this

      /* eslint-disable prefer-arrow-callback */
      const result = Meteor.runAsUser(userId, function () {
        const room = RocketChat.models.Rooms.findOneByName(name)
        if (!room) {
          throw new Meteor.Error('error-invalid-room', `there is no room named ${name}`)
        }
        return Meteor.call('sendMessage', {msg, rid: room._id})
      })
      return successResponse({result})
    } catch (err) {
      console.error(err.stack)
      RavenLogger.log(err)
      return errorResponse(err)
    }
  }
})

Api.addRoute('rooms/:name', {authRequired: true}, {
  delete() {
    try {
      const {
        userId,
        urlParams: {name},
      } = this

      const result = Meteor.runAsUser(userId, function () {
        const room = RocketChat.models.Rooms.findOneByName(name)
        if (!room) {
          throw new Meteor.Error('error-invalid-room', `there is no room named ${name}`)
        }
        return Meteor.call('eraseRoom', room._id)
      })
      return successResponse({result})
    } catch (err) {
      console.error(err.stack)
      RavenLogger.log(err)
      return errorResponse(err)
    }
  }
})
