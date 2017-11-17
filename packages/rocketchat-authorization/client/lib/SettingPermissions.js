RocketChat.authz.settingCachedCollectiong = new RocketChat.CachedCollection({
	name: 'setting-permissions',
	eventType: 'onLogged',
	userRelated: false
});
RocketChat.authz.settingCachedCollectiong.init();

this.SettingPermissions = RocketChat.authz.settingCachedCollectiong.collection;
