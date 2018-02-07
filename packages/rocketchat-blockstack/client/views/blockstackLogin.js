// Replace normal login form with Blockstack button
Template.blockstackLogin.replaces('loginForm')

// Render button when services configuration complete
Template.loginForm.helpers({
  isPasswordLogin: function () {
    return (FlowRouter.getQueryParam('login') === 'password')
  },
  configurationLoaded: function () {
    return Accounts.loginServicesConfigured()
  },
  passwordLoginLink: function () {
    if (FlowRouter.getQueryParam('login') === 'password') {
      return `<p><a href="#" id="blockstackLogin">${TAPi18n.__('Login_with_blockstack')}</a></p>`
    } else {
      return `<p><a href="#" id="passwordLogin">${TAPi18n.__('Login_with_password')}</a></p>`
    }
  },
  poweredByRocketChat: function () {
    return `<p>${TAPi18n.__('Powered_by_open_source')} <a href="https://rocket.chat">Rocket.Chat</a></p>`
  }
})

// Trigger login (redirect or popup) on click
Template.loginForm.events({
  'click #signin-button' (e, t) {
    e.preventDefault()
    Meteor.loginWithBlockstack({}, (error) => {
      if (error) Session.set('errorMessage', error.reason || 'Unknown error')
    })
  },
  'click #passwordLogin' (e, t) {
    e.preventDefault()
    FlowRouter.setQueryParams({ login: 'password' })
  },
  'click #blockstackLogin' (e, t) {
    e.preventDefault()
    FlowRouter.setQueryParams({ login: null })
  },
})
