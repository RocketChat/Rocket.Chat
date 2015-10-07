
Meteor.startup ->
  RocketChat.settings.add 'Accounts_OAuth_GitHub_Enterprise', false, {type: 'boolean', group: 'Accounts', section: 'GitHub Enterprise', i18nLabel: 'OAuth Enabled'}
  RocketChat.settings.add 'API_GitHub_Enterprise_URL', '', { type: 'string', group: 'Accounts', public: true, section: 'GitHub Enterprise', i18nLabel: 'Server URL' }
  RocketChat.settings.add	'Accounts_OAuth_GitHub_Enterprise_id', '', { type: 'string', group: 'Accounts', section: 'GitHub Enterprise', i18nLabel: 'Client ID' }
  RocketChat.settings.add	'Accounts_OAuth_GitHub_Enterprise_secret', '', { type: 'string', group: 'Accounts', section: 'GitHub Enterprise', i18nLabel: 'Client Secret' }
