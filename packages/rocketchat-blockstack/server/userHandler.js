const logger = new Logger('Blockstack')

// Updates or creates a user after we authenticate with Blockstack
// Clones Accounts.updateOrCreateUserFromExternalService with some modifications
Accounts.blockstack.updateOrCreateUser = (serviceData, options) => {
  const serviceConfig = ServiceConfiguration.configurations.findOne({ service: 'blockstack' })

  // Look for existing Blockstack user
  let user = Meteor.users.findOne({ 'services.blockstack.id': serviceData.id })

  // None found, create a user
  // TODO: reinstate profile fields when returned
  if (!user) {
    const newUser = {
      name: null, // options.profile.name,
      active: true,
      emails: null, // options.profile.emails,
      services: { blockstack: serviceData }
    }
    logger.info(`New user for Blockstack ID ${ serviceData.id }`)
    logger.debug('New user', newUser)

    // Set username same as in blockstack, or suggest if none
    // if (options.profile.username) newUser.username = options.profile.username
    // else if (serviceConfig.generateUsername === true) {
    const username = RocketChat.generateUsernameSuggestion(newUser)
    if (username) newUser.username = username
    // }

    // Make it real!
    const userId = Accounts.insertUserDoc({}, newUser)

    // Get the created user to make a couple more mods before returning
    user = Meteor.users.findOne(userId)
  } else {
    logger.info(`User login with Blockstack ID ${ serviceData.id }`)
    userId = user._id
  }

  // Add login token for blockstack auth session (take expiration from response)
  // TODO: Regquired method result format ignores `.when`
  const { token } = Accounts._generateStampedLoginToken()
  const tokenExpires = serviceData.expiresAt
  logger.debug('User login token', token, tokenExpires) // may be too verbose?

  return {
    type: 'blockstack',
    userId,
    token,
    tokenExpires
  }
}
