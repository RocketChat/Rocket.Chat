FlowRouter.route('/_blockstack/validate', {
  name: 'blockstackValidate',
  action(params, queryParams) {
    if (!Meteor.userId() && queryParams.authResponse !== undefined) {
      console.log('Stored user data', localStorage.getItem('blockstack'))
      console.log('Auth response', queryParams.authResponse)
      Accounts.callLoginMethod({
        methodArguments: [{
          blockstack: true,
          authResponse: queryParams.authResponse,
          userData: localStorage.getItem('blockstack')
        }],
        userCallback () { FlowRouter.go('home') }
      })
    } else {
      if (Meteor.userId()) throw new Meteor.Error('Blockstack: Auth validation request while already logged in.')
      if (queryParams.authResponse === undefined) throw new Meteor.Error('Blockstack: Auth validation request without response param.')
    }
  }
})
