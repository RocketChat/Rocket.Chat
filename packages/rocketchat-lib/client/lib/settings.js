import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { t } from 'meteor/rocketchat:utils';
import { modal } from 'meteor/rocketchat:ui-utils';
import { settings } from 'meteor/rocketchat:settings';
import { hasRole } from 'meteor/rocketchat:authorization';

Meteor.startup(function() {
	Tracker.autorun(function(c) {
		const siteUrl = settings.get('Site_Url');
		if (!siteUrl || (Meteor.userId() == null)) {
			return;
		}
		if (hasRole(Meteor.userId(), 'admin') === false || Meteor.settings.public.sandstorm) {
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
					html: true,
				}, function() {
					Meteor.call('saveSetting', 'Site_Url', currentUrl, function() {
						modal.open({
							title: t('Saved'),
							type: 'success',
							timer: 1000,
							showConfirmButton: false,
						});
					});
				});
			}
		}, 100);
		const documentDomain = settings.get('Document_Domain');
		if (documentDomain) {
			window.document.domain = documentDomain;
		}
		return c.stop();
	});
});
