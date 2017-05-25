RocketChat.settings.addGroup('InternalHubot', function() {
});
RocketChat.settings.add('InternalHubot_Enabled', false, { type: 'boolean', group: 'InternalHubot', i18nLabel: 'Enabled' });
RocketChat.settings.add('InternalHubot_Username', 'rocket.cat', { type: 'string', group: 'InternalHubot', i18nLabel: 'Username', i18nDescription: 'InternalHubot_Username_Description' });
// RocketChat.settings.add('InternalHubot_ScriptsToLoad', 'hello.coffee,zen.coffee', { type: 'string', group: 'InternalHubot'});
RocketChat.settings.add('InternalHubot_ScriptsToLoad', '', { type: 'string', group: 'InternalHubot'});
RocketChat.settings.add('InternalHubot_PathToLoadCustomScripts', '', { type: 'string', group: 'InternalHubot'});
RocketChat.settings.add('InternalHubot_reload', 'reloadInternalHubot', {
	type: 'action',
	group: 'InternalHubot',
	actionText: 'reload'
});
