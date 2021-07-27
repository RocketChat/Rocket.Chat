import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import toastr from 'toastr';

import { t } from '../../../utils';
import { settings } from '../../../settings';
import { hasRole } from '../../../authorization';
import { Roles } from '../../../models/client';
import { imperativeModal } from '../../../../client/lib/imperativeModal';
import UrlChangeModal from '../../../../client/components/UrlChangeModal';
import { isSyncReady } from '../../../../client/lib/userData';

Meteor.startup(function() {
	Tracker.autorun(function(c) {
		if (!Meteor.userId()) {
			return;
		}

		if (!Roles.ready.get() || !isSyncReady.get()) {
			return;
		}

		if (hasRole(Meteor.userId(), 'admin') === false) {
			return c.stop();
		}

		const siteUrl = settings.get('Site_Url');
		if (!siteUrl) {
			return;
		}

		const currentUrl = location.origin + __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
		if (__meteor_runtime_config__.ROOT_URL.replace(/\/$/, '') !== currentUrl) {
			const confirm = () => {
				imperativeModal.close();
				Meteor.call('saveSetting', 'Site_Url', currentUrl, function() {
					toastr.success(t('Saved'));
				});
			};
			imperativeModal.open({
				component: UrlChangeModal,
				props: {
					onConfirm: confirm,
					siteUrl,
					currentUrl,
					onClose: imperativeModal.close,
				},
			});
		}

		const documentDomain = settings.get('Document_Domain');
		if (documentDomain) {
			window.document.domain = documentDomain;
		}

		return c.stop();
	});
});
