
/*
* RocketChat.settings holds all packages settings
* @namespace RocketChat.settings
*/

/* globals ReactiveDict*/

RocketChat.settings.cachedCollection = new RocketChat.CachedCollection({
	name: 'public-settings',
	eventType: 'onAll',
	userRelated: false
});

RocketChat.settings.collection = RocketChat.settings.cachedCollection.collection;

RocketChat.settings.cachedCollection.init();

RocketChat.settings.dict = new ReactiveDict('settings');

RocketChat.settings.get = function(_id) {
	return RocketChat.settings.dict.get(_id);
};

RocketChat.settings.init = function() {
	let initialLoad = true;
	RocketChat.settings.collection.find().observe({
		added(record) {
			Meteor.settings[record._id] = record.value;
			RocketChat.settings.dict.set(record._id, record.value);
			RocketChat.settings.load(record._id, record.value, initialLoad);
		},
		changed(record) {
			Meteor.settings[record._id] = record.value;
			RocketChat.settings.dict.set(record._id, record.value);
			RocketChat.settings.load(record._id, record.value, initialLoad);
		},
		removed(record) {
			delete Meteor.settings[record._id];
			RocketChat.settings.dict.set(record._id, null);
			RocketChat.settings.load(record._id, null, initialLoad);
		}
	});
	initialLoad = false;
};

RocketChat.settings.init();

Meteor.startup(function() {
	if (Meteor.isCordova === true) {
		return;
	}
	Tracker.autorun(function(c) {
		const siteUrl = RocketChat.settings.get('Site_Url');
		if (!siteUrl || (Meteor.userId() == null)) {
			return;
		}
		if (RocketChat.authz.hasRole(Meteor.userId(), 'admin') === false || Meteor.settings['public'].sandstorm) {
			return c.stop();
		}
		Meteor.setTimeout(function() {
			const currentUrl = location.origin + __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
			if (__meteor_runtime_config__.ROOT_URL.replace(/\/$/, '') !== currentUrl) {
				modal.open({
					type: 'warning',
					title: t('Warning'),
					text: `${ t('The_setting_s_is_configured_to_s_and_you_are_accessing_from_s', t('Site_Url'), siteUrl, currentUrl) }<br/><br/>${ t('Do_you_want_to_change_to_s_question', currentUrl) }`,
					showCancelButton: true,
					confirmButtonText: t('Yes'),
					cancelButtonText: t('Cancel'),
					closeOnConfirm: false,
					html: true
				}, function() {
					Meteor.call('saveSetting', 'Site_Url', currentUrl, function() {
						modal.open({
							title: t('Saved'),
							type: 'success',
							timer: 1000,
							showConfirmButton: false
						});
					});
				});
			}
		}, 100);
		return c.stop();
	});
});
