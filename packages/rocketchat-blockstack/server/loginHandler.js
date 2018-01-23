import { decodeToken } from 'blockstack'

Accounts.blockstack.getUserData = (requestData) => {
  try {
    const { username, profile, appPrivateKey, authResponseToken } = JSON.parse(requestData.userData)
    const { signature: sig1 } = decodeToken(requestData.authResponse)
    const { payload, signature: sig2 } = decodeToken(authResponseToken)
    const blockstackID = payload.iss.split(':').pop()
    if (!(blockstackID && profile && appPrivateKey)) return {
      type: 'blockstack',
      error: new Meteor.error(Accounts.LoginCancelledError.numericError, 'Insufficient data in auth response token')
    }
    return { blockstackID, username, profile, appPrivateKey, sig1, sig2, payload }
  } catch (e) {
    // TODO: log error
  }
}

// Blockstack login handler, triggered by a blockstack authResponse in route
Accounts.registerLoginHandler('blockstack', (loginRequest) => {
  const serviceConfig = ServiceConfiguration.configurations.findOne({ service: 'blockstack' })

  if (!loginRequest.blockstack || !loginRequest.authResponse) return

  // No user data means login failed
  if (loginRequest.userData == undefined) return {
    type: 'blockstack',
    error: new Meteor.error(Accounts.LoginCancelledError.numericError, 'No user data returned from auth provider')
  }

  // TODO: verify token

  // Extract data from JSON and tokenised reponse
  const { blockstackID, username, profile, payload } = Accounts.blockstack.getUserData(loginRequest)

  // Look for email in accounts - will not find, blockstack has no emails (yet?)
  let emails = profile.account.find((account) => (account.service == 'email'))
  if (Array.isArray(emails)) emails = emails.map((account) => {
    return { address: account.identifier, verified: true }
  })

  // Look for existing Blockstack user
  let user = Meteor.users.findOne({ 'services.blockstack.id': blockstackID })

  // None found, create a user
  if (!user) {
    const newUser = {
      name: profile.name,
      active: true,
      globalRoles: ['user'],
      emails: emails
    }
    // Set username same as in blockstack, or suggest if none
    if (profile.username) newUser.username = profile.username
    else if (serviceConfig.generateUsername === true) {
      const username = RocketChat.generateUsernameSuggestion(newUser)
      if (username) newUser.username = username
    }
    // Make it real!
    const _id = Accounts.insertUserDoc({}, newUser)
    user = Meteor.users.findOne({ _id })
    console.log('user', user)
  }

  // Add login token for blockstack auth session
  const stampedToken = Accounts._generateStampedLoginToken()
  Meteor.users.update(user, {
    $push: { 'services.resume.loginTokens': stampedToken }
  })

  // Remember ID as unique linker for user (better than email etc)
  // Remember payload details for I dunno, whatever
  Meteor.users.update({ _id: user._id }, { $set: { 'services.blockstack': {
    id: blockstackID,
    jti: payload.jti,
    iat: payload.iat,
    exp: payload.exp,
    iss: payload.iss
  }}})

  // TODO: set login to expire at `payload.exp` oclock

  // Send success and token back to account handlers
  return {
    userId: user._id,
    token: stampedToken.token
  }
})
