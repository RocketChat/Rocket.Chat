import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { hasRole } from '../../app/authorization/client';
import { Roles } from '../../app/models/client';
import { settings } from '../../app/settings/client';
import { sdk } from '../../app/utils/client/lib/SDKClient';
import { t } from '../../app/utils/lib/i18n';
import FingerprintChangeModal from '../components/FingerprintChangeModal';
import FingerprintChangeModalConfirmation from '../components/FingerprintChangeModalConfirmation';
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
				void sdk.call('saveSetting', 'Site_Url', currentUrl).then(() => {
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

		const deploymentFingerPrintVerified = settings.get('Deployment_FingerPrint_Verified');
		if (deploymentFingerPrintVerified == null || deploymentFingerPrintVerified === true) {
			return;
		}

		const updateWorkspace = (): void => {
			imperativeModal.close();
			void sdk.rest.post('/v1/fingerprint', { setDeploymentAs: 'updated-configuration' }).then(() => {
				dispatchToastMessage({ type: 'success', message: t('Configuration_update_confirmed') });
			});
		};

		const setNewWorkspace = (): void => {
			imperativeModal.close();
			void sdk.rest.post('/v1/fingerprint', { setDeploymentAs: 'new-workspace' }).then(() => {
				dispatchToastMessage({ type: 'success', message: t('New_workspace_confirmed') });
			});
		};

		const openModal = (): void => {
			imperativeModal.open({
				component: FingerprintChangeModal,
				props: {
					onConfirm: () => {
						imperativeModal.open({
							component: FingerprintChangeModalConfirmation,
							props: {
								onConfirm: setNewWorkspace,
								onCancel: openModal,
								newWorkspace: true,
							},
						});
					},
					onCancel: () => {
						imperativeModal.open({
							component: FingerprintChangeModalConfirmation,
							props: {
								onConfirm: updateWorkspace,
								onCancel: openModal,
								newWorkspace: false,
							},
						});
					},
					onClose: imperativeModal.close,
				},
			});
		};

		openModal();

		return c.stop();
	});
});
