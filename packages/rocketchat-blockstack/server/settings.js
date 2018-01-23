RocketChat.settings.addGroup('Blockstack')

// Rocket.Chat Blockstack provider config defaults, settings can override
Accounts.blockstack.defaults = {
  enable: true,
  host: 'http://localhost:8888/',
  loginStyle: 'redirect',
	generateUsername: false,
  debug: true,
  manifestURI: Meteor.absoluteUrl(Accounts.blockstack.manifestPath),
  redirectURI: Meteor.absoluteUrl(Accounts.blockstack.redirectPath)
}

Meteor.startup(() => {
  let defaults = Accounts.blockstack.defaults
  RocketChat.settings.add('Blockstack_Enable', defaults.enable, {
    type: 'boolean',
    group: 'Blockstack',
    i18nLabel: 'Blockstack_Enable'
  })
  RocketChat.settings.add('Blockstack_Host', defaults.host, {
    type: 'string',
    group: 'Blockstack',
    i18nLabel: 'Blockstack_Host'
  })
  RocketChat.settings.add('Accounts_OAuth_Dolphin_login_style', defaults.loginStyle, {
    type: 'select',
    group: 'Blockstack',
    i18nLabel: 'Blockstack_Login_Style',
    values: [
      { key: 'redirect', i18nLabel: 'Redirect' },
      { key: 'popup', i18nLabel: 'Popup' }
    ]
  })
  RocketChat.settings.add('Blockstack_Generate_Username', defaults.generateUsername, {
    type: 'boolean',
    group: 'Blockstack',
    i18nLabel: 'Blockstack_Generate_Username'
  })
})

Accounts.blockstack.getSettings = () => {
  let fallbacks = Accounts.blockstack.defaults
  let settings = {
    enable: RocketChat.settings.get('Blockstack_Enable'),
    host: RocketChat.settings.get('Blockstack_Host'),
    generateUsername: RocketChat.settings.get('Blockstack_Generate_Username'),
    loginStyle: RocketChat.settings.get('Blockstack_Login_Style')
  }
  return Object.assign({}, fallbacks, settings)
}

ServiceConfiguration.configurations.upsert(
  { service: 'blockstack' },
  { $set: Accounts.blockstack.getSettings() }
)
