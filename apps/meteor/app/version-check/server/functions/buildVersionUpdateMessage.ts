import { Settings } from '@rocket.chat/models';
import semver from 'semver';

import { i18n } from '../../../../server/lib/i18n';
import { sendMessagesToAdmins } from '../../../../server/lib/sendMessagesToAdmins';
import { settings } from '../../../settings/server';
import { Info } from '../../../utils/rocketchat.info';

export const buildVersionUpdateMessage = async (
	versions: {
		version: string;
		security: boolean;
		infoUrl: string;
	}[] = [],
) => {
	const lastCheckedVersion = settings.get<string>('Update_LatestAvailableVersion');

	if (!lastCheckedVersion) {
		return;
	}

	for await (const version of versions) {
		// Ignore prerelease versions
		if (semver.prerelease(version.version)) {
			continue;
		}

		if (semver.lte(version.version, lastCheckedVersion)) {
			continue;
		}

		if (semver.lte(version.version, Info.version)) {
			continue;
		}

		await Settings.updateValueById('Update_LatestAvailableVersion', version.version);

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
