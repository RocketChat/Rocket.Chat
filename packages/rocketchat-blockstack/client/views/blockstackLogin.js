Template.blockstackLogin.replaces('loginForm')

Template.loginForm.helpers({
  configurationLoaded: function () {
    return Accounts.loginServicesConfigured();
  }
})

Template.loginForm.events({
  'click #signin-button' (e, t) {
    e.preventDefault()
    Meteor.loginWithBlockstack({}, (error) => {
      if (error) {
        Session.set('errorMessage', error.reason || 'Unknown error');
      }
    })
  }
})
