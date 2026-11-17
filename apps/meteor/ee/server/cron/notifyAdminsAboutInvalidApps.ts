import type { ProxiedApp } from '@rocket.chat/apps/dist/server/ProxiedApp';
import { Users } from '@rocket.chat/models';

import { i18n } from '../../../server/lib/i18n';
import { sendMessagesToAdmins } from '../../../server/lib/sendMessagesToAdmins';

export const notifyAdminsAboutInvalidApps = async function _notifyAdminsAboutInvalidApps(apps?: ProxiedApp[]) {
	if (!apps) {
		return;
	}

	const hasInvalidApps = !!apps.find((app) => app.getLatestLicenseValidationResult().hasErrors);

	if (!hasInvalidApps) {
		return apps;
	}

	const id = 'someAppInInvalidState';
	const title = 'Warning';
	const link = '/marketplace/installed';

	await sendMessagesToAdmins({
		msgs: async ({ adminUser }) => ({
			msg: `*${i18n.t(title, { lng: adminUser.language || 'en' })}*\n${i18n.t('Invalid_apps_admin_message', {
				lng: adminUser.language || 'en',
				marketplace: i18n.t('Marketplace', { lng: adminUser.language || 'en' }),
				installed: i18n.t('Installed', { lng: adminUser.language || 'en' }),
			})}`,
		}),
		banners: async ({ adminUser }) => {
			await Users.removeBannerById(adminUser._id, id);

			return [
				{
					id,
					priority: 10,
					title,
					text: i18n.t('Invalid_apps_banner_text', { lng: adminUser.language || 'en' }),
					modifiers: ['danger'],
					link,
				},
			];
		},
	});

	return apps;
};
