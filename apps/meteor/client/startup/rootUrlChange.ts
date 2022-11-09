import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { hasRole } from '../../app/authorization/client';
import { Roles } from '../../app/models/client';
import { settings } from '../../app/settings/client';
import { t } from '../../app/utils/client';
import UrlChangeModal from '../components/UrlChangeModal';
import { imperativeModal } from '../lib/imperativeModal';
import { dispatchToastMessage } from '../lib/toast';
import { isSyncReady } from '../lib/userData';

Meteor.startup(() => {
	Tracker.autorun((c) => {
		const userId = Meteor.userId();
		if (!userId) {
			return;
		}

		if (!Roles.ready.get() || !isSyncReady.get()) {
			return;
		}

		if (hasRole(userId, 'admin') === false) {
			return c.stop();
		}

		const siteUrl = settings.get('Site_Url');
		if (!siteUrl) {
			return;
		}

		const currentUrl = location.origin + window.__meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
		if (window.__meteor_runtime_config__.ROOT_URL.replace(/\/$/, '') !== currentUrl) {
			const confirm = (): void => {
				imperativeModal.close();
				Meteor.call('saveSetting', 'Site_Url', currentUrl, () => {
					dispatchToastMessage({ type: 'success', message: t('Saved') });
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
