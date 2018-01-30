import blockstack from 'blockstack'

FlowRouter.route('/_blockstack/validate', {
  name: 'blockstackValidate',
  action(params, queryParams) {
    if (!Meteor.userId() && queryParams.authResponse !== undefined) {
      const userData = localStorage.getItem('blockstack') || blockstack.loadUserData()
      console.log('Got user data', userData)
      console.log('Auth response', queryParams.authResponse)
      Accounts.callLoginMethod({
        methodArguments: [{
          blockstack: true,
          authResponse: queryParams.authResponse,
          userData: userData
        }],
        userCallback () { FlowRouter.go('home') }
      })
    } else {
      if (Meteor.userId()) throw new Meteor.Error('Blockstack: Auth validation request while already logged in.')
      if (queryParams.authResponse === undefined) throw new Meteor.Error('Blockstack: Auth validation request without response param.')
    }
  }
})
