FlowRouter.route('/_blockstack/validate', {
  name: 'blockstackValidate',
  action(params, queryParams) {
    if (!Meteor.userId() && queryParams.authResponse !== undefined) {
      Accounts.callLoginMethod({
        methodArguments: [{
          blockstack: true,
          authResponse: queryParams.authResponse,
          userData: localStorage.getItem('blockstack')
        }],
        userCallback () { FlowRouter.go('home') }
      })
    }
  }
})
