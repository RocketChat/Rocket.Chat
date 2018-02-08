import blockstack from 'blockstack'

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
    redirectURI: `${window.location.origin}/`, // location to redirect user to after sign in approval
    manifestURI: `${window.location.origin}/manifest.json`, // location of this app's manifest file
    scopes: ['store_write'] // the permissions this app is requesting
  }
  let params = mergeParams(defaults, config)
  return blockstack.redirectToSignIn(...params)
}

// Do a custom blockstack redirect through auth services
const makeAuthRequest = (config) => {
  let defaults = {
    transitPrivateKey: blockstack.generateAndStoreTransitKey(), // hex encoded transit private key
    redirectURI: `${window.location.origin}/`, // location to redirect user to after sign in approval
    manifestURI: `${window.location.origin}/manifest.json`, // location of this app's manifest file
    scopes: ['store_write'], // the permissions this app is requesting
    appDomain: `${window.location.origin}` // the origin of this app
  }
  // NB: omitted expiresAt: nextHour().getTime() // the time at which this request is no longer valid
  let params = mergeParams(defaults, config)
  return blockstack.makeAuthRequest(...params)
}

// Save the auth request for when redirect returns
const saveDataForRedirect = (privateKey, authRequest) => {
  Reload._onMigrate('blockstack', () => [true, {authRequest: authRequest}])
  Reload._migrate(null, {immediateMigration: true})
}

// Send user to Blockstack with auth request
// TODO: allow serviceConfig.loginStyle == popup
Meteor.loginWithBlockstack = (option={}, callback) => {
  const serviceConfig = ServiceConfiguration.configurations.findOne({ service: 'blockstack' })
  const privateKey = blockstack.generateAndStoreTransitKey()
  const requestParams = Object.assign({ transitPrivateKey: privateKey }, serviceConfig)
  const authRequest = makeAuthRequest(requestParams)
  const httpsURI = `${serviceConfig.blockstackIDHost}?authRequest=${authRequest}`
  saveDataForRedirect(privateKey, authRequest)
  window.location.assign(httpsURI) // hack redirect without protocol handler
  /*
    // NB: using smarter protocol detection gets routed to new tab by Rocket.Chat :(
    import protocolCheck from 'custom-protocol-detection-blockstack'
    const protocolURI = `blockstack:${authRequest}`
    const protocolSuccess = () => console.log('protocol handler detected')
    const protocolFail = () => window.location.assign(httpsURI)
    const protocolUnsupported = () => window.location.assign(protocolURI)
    protocolCheck(protocolURI, protocolFail, protocolSuccess, protocolUnsupported)
  */
}

/*

// Process logging out user from Rocket.Chat and Blockstack
// Overrides the standard logout - may be extended in future
const MeteorLogout = Meteor.logout
Meteor.logout = () => {
  const serviceConfig = ServiceConfiguration.configurations.findOne({ service: 'blockstack' })
  const blockstackAuth = Session.get('blockstack_auth')
	if (serviceConfig && blockstackAuth) return Meteor.logoutWithBlockstack()
	return MeteorLogout.apply(Meteor, arguments);
}

// Call server side logout actions and trigger Blockstack logout on success
Meteor.logoutWithBlockstack = (options={}) => {
	Meteor.call('blockstackLogout', options, (err, result) => {
		if (err || !result) return MeteorLogout.apply(Meteor)
    Session.delete('blockstack_auth')
  	blockstack.signUserOut(window.location.href)
	})
}

*/
