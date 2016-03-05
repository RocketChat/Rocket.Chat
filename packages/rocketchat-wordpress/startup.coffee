RocketChat.settings.add 'API_Wordpress_URL', '', { type: 'string', group: 'Accounts', public: true, section: 'WordPress' }
RocketChat.settings.add 'Accounts_OAuth_Wordpress', false, { type: 'boolean', group: 'Accounts', section: 'WordPress' }
RocketChat.settings.add 'Accounts_OAuth_Wordpress_id', '', { type: 'string', group: 'Accounts', section: 'WordPress' }
RocketChat.settings.add 'Accounts_OAuth_Wordpress_secret', '', { type: 'string', group: 'Accounts', section: 'WordPress' }
RocketChat.settings.add 'Accounts_OAuth_Wordpress_callback_url', __meteor_runtime_config__?.ROOT_URL + '_oauth/wordpress', { type: 'string', blocked: true }

