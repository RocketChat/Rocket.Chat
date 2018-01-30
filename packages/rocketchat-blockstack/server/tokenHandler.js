import { decodeToken } from 'blockstack'
const logger = new Logger('Blockstack')

// Handler extracts data from JSON and tokenised reponse.
// Reflects OAuth token service, with some slight modifications for Blockstack.
//
// Uses 'iss' (issuer) as unique key (decentralised ID) for user.
// The 'did' final portion of the blockstack decentralised ID, is displayed as
// your profile ID in the service. This isn't used yet, but could be useful
// to link accounts if identity providers other than btc address are added.
Accounts.blockstack.handleAccessToken = (loginRequest) => {
  logger.debug('Login request received', loginRequest)

  check(loginRequest, Match.ObjectIncluding({
    userData: String,
    authResponse: String
  }))

  const { username, profile, appPrivateKey, authResponseToken } = JSON.parse(loginRequest.userData)
  const { signature: sig1 } = decodeToken(loginRequest.authResponse)
  const { payload, signature: sig2 } = decodeToken(authResponseToken)
  if (!(payload && profile && appPrivateKey)) return {
    type: 'blockstack',
    error: new Meteor.error(Accounts.LoginCancelledError.numericError, 'Insufficient data in auth response token')
  }

  logger.info(`Login token processed for ${username}`)

  const serviceData = {
    id: payload.iss,
    did: `ID-${payload.iss.split(':').pop()}`,
    accessToken: authResponseToken,
    issuedAt: new Date(payload.iat*1000),
    expiresAt: new Date(payload.exp*1000)
  }

  logger.debug('Login data', serviceData)

  return {
    serviceData,
    options: { profile }
  }
}
