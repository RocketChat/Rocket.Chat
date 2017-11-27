RocketChat.authz.settingCachedCollection = new RocketChat.CachedCollection({
	name: 'setting-permissions',
	eventType: 'onLogged',
	userRelated: false
});
RocketChat.authz.settingCachedCollection.init();

this.SettingPermissions = RocketChat.authz.settingCachedCollection.collection;
