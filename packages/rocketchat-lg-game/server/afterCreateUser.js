/* global logger, getServiceBaseURL, graphQLFetcher, GAME */

function getChapterChannelName(lgJWT, lgUser) {
  const query = {
    query: `
query($id: ID!) {
  getUserById(id: $id) {
    chapter {
      channelName
    }
  }
}
    `,
    variables: {id: lgUser.id},
  }

  return graphQLFetcher(lgJWT, getServiceBaseURL(GAME))(query)
    .then(data => data.getUserById)
    .then(user => user.chapter.channelName)
}

function joinGameChannels(rcUser) {
  const {lgJWT, lgUser} = rcUser.services.lgSSO
  return getChapterChannelName(lgJWT, lgUser)
    .then(chapterChannelName => {
      Meteor.runAsUser(rcUser._id, () => {
        ['welcome', chapterChannelName].forEach(channelName => {
          logger.log(`${lgUser.handle} is joining ${channelName} ...`)
          const room = RocketChat.models.Rooms.findOneByName(channelName)
          Meteor.call('joinRoom', room._id)
        })
      })
    })
}

function userIsInGame(lgUser) {
  if (!lgUser || !lgUser.roles) {
    return false
  }
  return lgUser.roles.indexOf('player') >= 0 || lgUser.roles.indexOf('moderator') >= 0
}

// for some reason, the passed-in user doesn't have an _id, so we need to
// find the user by their username
function afterCreateUser(options, {username}) {
  try {
    const rcUser = Meteor.users.findOne({username})
    const {lgUser} = rcUser.services.lgSSO
    if (userIsInGame(lgUser)) {
      joinGameChannels(rcUser)
        .catch(err => {
          throw new Error(`unable to join game channels: ${err.message || err}`)
        })
    }
  } catch (err) {
    logger.error(err.stack || err)
    RavenLogger.log(err)
  }
}

/* eslint-disable prefer-arrow-callback */
Meteor.startup(function () {
  try {
    RocketChat.callbacks.add('afterCreateUser', afterCreateUser)
  } catch (err) {
    logger.error(err.stack || err)
    RavenLogger.log(err)
  }
})
