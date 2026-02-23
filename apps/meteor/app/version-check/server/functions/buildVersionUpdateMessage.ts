import { Settings, Users } from '@rocket.chat/models';
import semver from 'semver';

import { i18n } from '../../../../server/lib/i18n';
import { sendMessagesToAdmins } from '../../../../server/lib/sendMessagesToAdmins';
import { updateAuditedBySystem } from '../../../../server/settings/lib/auditedSettingUpdates';
import { notifyOnSettingChangedById } from '../../../lib/server/lib/notifyListener';
import { settings } from '../../../settings/server';
import { Info } from '../../../utils/rocketchat.info';

const cleanupOutdatedVersionBanners = async (): Promise<void> => {
	const admins = Users.findUsersInRolesWithQuery('admin', { banners: { $exists: true } }, { projection: { _id: 1, banners: 1 } });

	for await (const admin of admins) {
		if (!admin.banners) {
			continue;
		}

		for await (const bannerId of Object.keys(admin.banners)) {
			if (!bannerId.startsWith('versionUpdate-')) {
				continue;
			}

			const version = bannerId.replace('versionUpdate-', '').replace(/_/g, '.');
			if (semver.valid(version) && semver.lte(version, Info.version)) {
				await Users.removeBannerById(admin._id, bannerId);
			}
		}
	}
};

export const buildVersionUpdateMessage = async (
	versions: {
		version: string;
		security: boolean;
		infoUrl: string;
	}[] = [],
) => {
	if (process.env.TEST_MODE) {
		return;
	}

	const lastCheckedVersion = settings.get<string>('Update_LatestAvailableVersion');

	if (!lastCheckedVersion) {
		return;
	}

	const sortedVersions = [...versions].sort((a, b) => semver.rcompare(a.version, b.version));

	await cleanupOutdatedVersionBanners();

	for await (const version of sortedVersions) {
		if (semver.prerelease(version.version)) {
			continue;
		}

		if (semver.lte(version.version, lastCheckedVersion)) {
			continue;
		}

		if (semver.lte(version.version, Info.version)) {
			continue;
		}

		(
			await updateAuditedBySystem({
				reason: 'buildVersionUpdateMessage',
			})(Settings.updateValueById, 'Update_LatestAvailableVersion', version.version)
		).modifiedCount && void notifyOnSettingChangedById('Update_LatestAvailableVersion');

		await sendMessagesToAdmins({
			msgs: async ({ adminUser }) => [
				{
					msg: `*${i18n.t('Update_your_RocketChat', { ...(adminUser.language && { lng: adminUser.language }) })}*\n${i18n.t(
						'New_version_available_(s)',
						{
							postProcess: 'sprintf',
							sprintf: [version.version],
						},
					)}\n${version.infoUrl}`,
				},
			],
			banners: [
				{
					id: `versionUpdate-${version.version}`.replace(/\./g, '_'),
					priority: 10,
					title: 'Update_your_RocketChat',
					text: 'New_version_available_(s)',
					textArguments: [version.version],
					link: version.infoUrl,
					modifiers: [],
				},
			],
		});
		break;
	}
};
