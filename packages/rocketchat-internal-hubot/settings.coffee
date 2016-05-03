RocketChat.settings.addGroup 'InternalHubot'
RocketChat.settings.add 'InternalHubot_Enabled', true, { type: 'boolean', group: 'InternalHubot', i18nLabel: 'Enabled' }
RocketChat.settings.add 'InternalHubot_Username', 'Rocket.Cat', { type: 'string', group: 'InternalHubot', i18nLabel: 'Username', i18nDescription: 'InternalHubot_Username_Description' }
RocketChat.settings.add 'InternalHubot_ScriptsToLoad', 'hello.coffee,zen.coffee', { type: 'string', group: 'InternalHubot'}
