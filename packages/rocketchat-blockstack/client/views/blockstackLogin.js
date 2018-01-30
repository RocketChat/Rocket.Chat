Template.main.onCreated(() => {
  const blockstackConfig = ServiceConfiguration.configurations.findOne({ service: 'blockstack' }) || { enable: false }
  if (!blockstackConfig.enable) return

  // Replace normal login form with Blockstack button
  Template.blockstackLogin.replaces('loginForm')

  // Allow template methods to access service configuration
  Template.loginForm.onCreated(() => {
    this.serviceConfig = new ReactiveVar(blockstackConfig)
  })

  // Render button when services configuration complete
  Template.loginForm.helpers({
    configurationLoaded: function () {
      return Accounts.loginServicesConfigured()
    }
  })

  // Trigger login (redirect or popup) on click
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

})
