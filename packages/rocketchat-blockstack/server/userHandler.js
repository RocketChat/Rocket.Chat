const logger = new Logger('Blockstack')

// Updates or creates a user after we authenticate with Blockstack
// Clones Accounts.updateOrCreateUserFromExternalService with some modifications
Accounts.blockstack.updateOrCreateUser = (serviceData, options) => {
  const serviceConfig = ServiceConfiguration.configurations.findOne({ service: 'blockstack' })
  logger.debug('Auth config', serviceConfig)

  // Extract user data from service / token
  const { id } = serviceData
  const { profile } = options

  // Look for existing Blockstack user
  let user = Meteor.users.findOne({ 'services.blockstack.id': id })
  let userId

  // Fix absense of emails by adding initial empty email address
  // Reformat array of emails into expected format if they exist
  const emails = []
  if (!Array.isArray(profile.emails)) {
    emails.push({ address: '', verified: false })
  } else {
    emails = profile.emails.map((address) => { return {
      address,
      verified: true
    }})
  }

  // Use found or create a user
  if (user) {
    logger.info(`User login with Blockstack ID ${ id }`)
    userId = user._id
    // Meteor.users.update(userId, { $set: { 'services.blockstack.profile': profile } })
    // ^ threw errors from an app name in key having '.'
  } else {
    const newUser = {
      name: profile.name,
      active: true,
      emails: emails,
      services: { blockstack: serviceData }
    }
    logger.info(`New user for Blockstack ID ${ id }`)
    logger.debug('New user', newUser)

    // Set username same as in blockstack, or suggest if none
    if (profile.name) newUser.name = profile.name
    if (profile.username) newUser.username = profile.username
    else if (serviceConfig.generateUsername === true) {
      newUser.username = RocketChat.generateUsernameSuggestion(newUser)
    }

    // Make it real!
    userId = Accounts.insertUserDoc({}, newUser)

    // Get the created user to make a couple more mods before returning
    user = Meteor.users.findOne(userId)
  }

  // Add login token for blockstack auth session (take expiration from response)
  // TODO: Regquired method result format ignores `.when`
  const { token } = Accounts._generateStampedLoginToken()
  const tokenExpires = serviceData.expiresAt

  return {
    type: 'blockstack',
    userId,
    token,
    tokenExpires
  }
}
