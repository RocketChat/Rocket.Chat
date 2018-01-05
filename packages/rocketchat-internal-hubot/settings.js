RocketChat.settings.addGroup('InternalHubot', function() {
	this.add('InternalHubot_Enabled', false, { type: 'boolean', i18nLabel: 'Enabled' });
	this.add('InternalHubot_Username', 'rocket.cat', { type: 'string', i18nLabel: 'Username', i18nDescription: 'InternalHubot_Username_Description', 'public': true });
	this.add('InternalHubot_ScriptsToLoad', '', { type: 'string'});
	this.add('InternalHubot_PathToLoadCustomScripts', '', { type: 'string' });
	// this.add('InternalHubot_reload', 'reloadInternalHubot', {
	// 	type: 'action',
	// 	actionText: 'reload'
	// });
});
