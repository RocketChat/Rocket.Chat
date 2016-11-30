/* global userFromJWT:true, logger */
/* exported userFromJWT */

userFromJWT = Npm.require('@learnersguild/idm-jwt-auth/lib/utils').userFromJWT

function joinRoom(rcUser, roomName) {
  Meteor.runAsUser(rcUser._id, () => {
    const room = RocketChat.models.Rooms.findOneByName(roomName)
    Meteor.call('joinRoom', room._id)
  })
}

function setAvatarFromGitHubAvatar(rcUser, lgUser) {
  Meteor.runAsUser(rcUser._id, () => {
    logger.log('setting avatar from GitHub avatar')
    const url = `https://github.com/${lgUser.handle}.png?s=200`
    Meteor.call('setAvatarFromService', url, undefined, 'url')
  })
}

function createOrUpdateUserFromJWT(lgJWT) {
  const lgUser = userFromJWT(lgJWT)

  let rcUser = Meteor.users.findOne({
    'services.lgSSO.lgUser.id': lgUser.id
  })
  const roles = ['user']
  if (lgUser.roles.indexOf('backoffice') >= 0) {
    roles.push('admin')
  }
  const newUser = {
    name: lgUser.name,
    username: lgUser.handle,
    emails: [{address: lgUser.email, verified: true}],
    phone: [{phoneNumber: lgUser.phone}],
    roles,
    type: 'user',
    active: true,
  }
  const lgSSO = {lgUser, lgJWT}

  if (rcUser) {
    logger.log('found user, updating Rocket.Chat user info')
    // don't kill any previous resume tokens when updating user info
    const services = Object.assign({}, rcUser.services, {lgSSO})
    const mergedUser = Object.assign({}, newUser, {services})

    // Explicitly set username. It's a noop if the username is the same,
    // bit it triggers all of the history re-writing necessary
    // if the username really is changing.
    Meteor.runAsUser(rcUser._id, () =>
      Meteor.call('setUsername', lgUser.handle)
    )

    // Now update the rest of the user attributes
    Meteor.users.update(rcUser, mergedUser)
    rcUser = Meteor.users.findOne(rcUser._id)
  } else {
    logger.log('no such user, creating new Rocket.chat user')
    const mergedUser = Object.assign({}, newUser, {services: {lgSSO}})
    const userId = Accounts.insertUserDoc({}, mergedUser)
    rcUser = Meteor.users.findOne(userId)
  }

  // update user avatar using GitHub avatar
  try {
    setAvatarFromGitHubAvatar(rcUser, lgUser)
  } catch (err) {
    RavenLogger.log(err)
    logger.warn('could not set avatar from GitHub avatar', err.stack)
  }

  return rcUser
}

// allow the client to update our user record
Meteor.methods({createOrUpdateUserFromJWT})

Accounts.registerLoginHandler(loginRequest => {
  const {lgSSO, lgJWT} = loginRequest
  if (!lgSSO || !lgJWT) {
    return undefined
  }

  try {
    const rcUser = createOrUpdateUserFromJWT(lgJWT)

    try {
      joinRoom(rcUser, 'general')
    } catch (err) {
      RavenLogger.log(err)
      logger.warn('could not join `general` room', err.stack)
    }

    // create or update the login token
    const stampedToken = Accounts._generateStampedLoginToken()
    Meteor.users.update(rcUser, {
      $push: {
        'services.resume.loginTokens': stampedToken
      }
    })

    return {userId: rcUser._id, token: stampedToken.token}
  } catch (err) {
    RavenLogger.log(err)
    logger.error('error signing-in using SSO on idm service', err.stack)
  }

  return undefined
})

// make sure our lgSSO service data is returned with user object
Meteor.publish('lgUserData', function () {
  if (this.userId) {
    return Meteor.users.find(
      {_id: this.userId},
      {fields: {'services.lgSSO': 1}}
    )
  }
  this.ready()
})
