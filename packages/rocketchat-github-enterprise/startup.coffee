
Meteor.startup ->
  RocketChat.settings.add 'Accounts_OAuth_GitHub_Enterprise', false, {type: 'boolean', group: 'Accounts', section: 'GitHub Enterprise', i18nLabel: 'Accounts_OAuth_GitHub_Enterprise'}
  RocketChat.settings.add 'API_GitHub_Enterprise_URL', '', { type: 'string', group: 'Accounts', public: true, section: 'GitHub Enterprise', i18nLabel: 'API_GitHub_Enterprise_URL', i18nDescription: 'Github_Enterprise_Url_No_Trail' }
  RocketChat.settings.add	'Accounts_OAuth_GitHub_Enterprise_id', '', { type: 'string', group: 'Accounts', section: 'GitHub Enterprise', i18nLabel: 'Accounts_OAuth_GitHub_Enterprise_id' }
  RocketChat.settings.add	'Accounts_OAuth_GitHub_Enterprise_secret', '', { type: 'string', group: 'Accounts', section: 'GitHub Enterprise', i18nLabel: 'Accounts_OAuth_GitHub_Enterprise_secret' }
