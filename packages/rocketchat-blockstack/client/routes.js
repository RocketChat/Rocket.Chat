import blockstack from 'blockstack'

// Handle a Blockstack auth response
const blockstackLogin = (authResponse, userData = {}) => {
  Session.set('blockstack_auth', authResponse)

  Accounts.callLoginMethod({
    methodArguments: [{
      blockstack: true,
      authResponse: authResponse,
      userData: userData
    }],
    userCallback (result) {
      FlowRouter.go('home')
    }
  })
}

// Process returned auth requests and trigger login with response
FlowRouter.route('/_blockstack/validate', {
  name: 'blockstackValidate',
  action (params, queryParams) {
    if (!Meteor.userId() && queryParams.authResponse !== undefined) {
      if (blockstack.isUserSignedIn()) {
        blockstackLogin(queryParams.authResponse, blockstack.loadUserData())
      } else if (blockstack.isSignInPending()) {
        blockstack.handlePendingSignIn().then((userData) => {
          blockstackLogin(queryParams.authResponse, userData)
        })
      }
    } else if (Meteor.userId()) {
      throw new Meteor.Error('Blockstack: Auth request while already logged in.')
    } else if (queryParams.authResponse === undefined) {
      throw new Meteor.Error('Blockstack: Auth request without response param.')
    }
  }
})
