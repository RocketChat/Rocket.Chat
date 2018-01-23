FlowRouter.route('/_blockstack/validate', {
  name: 'blockstackLogin',
  action(params, queryParams) {
    if (!Meteor.userId() && queryParams.authResponse !== undefined) {
      Accounts.callLoginMethod({
        methodArguments: [{
          blockstack: true,
          authResponse: queryParams.authResponse
        }],
        userCallback () { FlowRouter.go('home') }
      })
    }
  }
})
