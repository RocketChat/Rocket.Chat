import blockstack from 'blockstack'
// import protocolCheck from 'custom-protocol-detection-blockstack'
import { openPopup } from './popup'

// Let service config set values, but not order of params
const mergeParams = (defaults, overrides) => {
  Object.keys(defaults).forEach(function(key) {
    if (key in overrides) defaults[key] = overrides[key]
  })
  return Object.values(defaults) // returns array without keys
}

// Do signin redirect, with location of manifest
const redirectToSignIn = (config) => {
  let defaults = {
    redirectURI: `${window.location.origin}/`,
    manifestURI: Accounts.blockstack.manifestURI,
    scopes: ['store_write']
  }
  let params = mergeParams(defaults, config)
  // console.log('redirect params', params)
  return blockstack.redirectToSignIn(...params)
}

// Do a custom blockstack redirect through auth services
const _makeAuthRequest = (config) => {
  let defaults = {
    transitPrivateKey: blockstack.generateAndStoreTransitKey(), // hex encoded transit private key
    redirectURI: `${window.location.origin}/`, // location to redirect user to after sign in approval
    manifestURI: `${window.location.origin}/manifest.json`, // location of this app's manifest file
    scopes: ['store_write'], // the permissions this app is requesting
    appDomain: `${window.location.origin}` // the origin of this app
  }
  // NB: omitted expiresAt: nextHour().getTime() // the time at which this request is no longer valid
  let params = mergeParams(defaults, config)
  console.log('auth params', params)
  return blockstack.makeAuthRequest(...params)
}

// Save the auth request for when redirect returns
// TODO: Not currently used, should do so
const _saveDataForRedirect = (privateKey, authRequest) => {
  Reload._onMigrate('blockstack', () => [true, {authRequest: authRequest}])
  Reload._migrate(null, {immediateMigration: true})
}

const _handleRedirectReturn = () => {
  Accounts.callLoginMethod({
    methodArguments: [{
      blockstack: true,
      authRequest: _makeAuthRequest(serviceConfig)
    }],
    userCallback: callback
  })
}

Meteor.loginWithBlockstack = function(option={}, callback) {
  const privateKey = blockstack.generateAndStoreTransitKey()
  const serviceConfig = ServiceConfiguration.configurations.findOne({service: 'blockstack'})
  const requestParams = Object.assign({ transitPrivateKey: privateKey }, serviceConfig)
  const authRequest = _makeAuthRequest(requestParams)
  const httpsURI = `${serviceConfig.blockstackIDHost}auth?authRequest=${authRequest}`
  // GO!...
  _saveDataForRedirect(privateKey, authRequest)
  // TODO: if serviceConfig.loginStyle == popup else...
  window.location.assign(httpsURI) // hack, just do it without protocol handler
  // NB: using smarter protocol detection gets routed to new tab by Rocket.Chat :(
  // const protocolURI = `blockstack:${authRequest}`
  // const protocolSuccess = () => console.log('protocol handler detected')
  // const protocolFail = () => window.location.assign(httpsURI)
  // const protocolUnsupported = () => window.location.assign(protocolURI)
  // protocolCheck(protocolURI, protocolFail, protocolSuccess, protocolUnsupported)
}
