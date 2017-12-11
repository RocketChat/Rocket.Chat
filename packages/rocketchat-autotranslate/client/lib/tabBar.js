Meteor.startup(function() {
	Tracker.autorun(function() {
		if (RocketChat.settings.get('AutoTranslate_Enabled') && RocketChat.authz.hasAtLeastOnePermission(['auto-translate'])) {
			RocketChat.TabBar.addButton({
				groups: ['channel', 'group', 'direct'],
				id: 'autotranslate',
				i18nTitle: 'Auto_Translate',
				icon: 'language',
				template: 'autoTranslateFlexTab',
				order: 20
			});
		} else {
			RocketChat.TabBar.removeButton('autotranslate');
		}
	});
});
