import type { ProxiedApp } from '@rocket.chat/apps/dist/server/ProxiedApp';
import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';

import { i18n } from '../../../server/lib/i18n';
import { sendMessagesToAdmins } from '../../../server/lib/sendMessagesToAdmins';

export const notifyAdminsAboutRenewedApps = async function _notifyAdminsAboutRenewedApps(apps?: ProxiedApp[]) {
	if (!apps) {
		return;
	}

	const statuses = await Promise.all(apps.map((app) => app.getStatus()));
	const hasRenewedApps = apps.some(
		(app, index) => statuses[index] === AppStatus.DISABLED && app.getPreviousStatus() === AppStatus.INVALID_LICENSE_DISABLED,
	);

	if (!hasRenewedApps) {
		return;
	}

	await sendMessagesToAdmins({
		msgs: async ({ adminUser }) => ({
			msg: i18n.t('Disabled_apps_admin_message', {
				lng: adminUser.language || 'en',
				marketplace: i18n.t('Marketplace', { lng: adminUser.language || 'en' }),
				installed: i18n.t('Installed', { lng: adminUser.language || 'en' }),
			}),
		}),
	});
};
