import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import semver from 'semver';
import { Settings } from '@rocket.chat/models';

import { getNewUpdates } from './getNewUpdates';
import { settings } from '../../../settings/server';
import { Info } from '../../../utils/server';
import { Users } from '../../../models/server';
import logger from '../logger';
import { sendMessagesToAdmins } from '../../../../server/lib/sendMessagesToAdmins';
// import getNewUpdates from '../sampleUpdateData';

export const checkVersionUpdate = async () => {
	logger.info('Checking for version updates');

	const { versions, alerts } = await getNewUpdates();

	const lastCheckedVersion = settings.get<string>('Update_LatestAvailableVersion');

	for await (const version of versions) {
		if (!lastCheckedVersion) {
			break;
		}
		if (semver.lte(version.version, lastCheckedVersion)) {
			continue;
		}

		if (semver.lte(version.version, Info.version)) {
			continue;
		}

		await Settings.updateValueById('Update_LatestAvailableVersion', version.version);

		await sendMessagesToAdmins({
			msgs: ({ adminUser }) => [
				{
					msg: `*${TAPi18n.__('Update_your_RocketChat', { ...(adminUser.language && { lng: adminUser.language }) })}*\n${TAPi18n.__(
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

	if (alerts?.length) {
		await sendMessagesToAdmins({
			msgs: ({ adminUser }) =>
				alerts
					.filter((alert) => !Users.bannerExistsById(adminUser._id, `alert-${alert.id}`))
					.map((alert) => ({
						msg: `*${TAPi18n.__('Rocket_Chat_Alert', { ...(adminUser.language && { lng: adminUser.language }) })}:*\n\n*${TAPi18n.__(
							alert.title,
							{ ...(adminUser.language && { lng: adminUser.language }) },
						)}*\n${TAPi18n.__(alert.text, {
							...(adminUser.language && { lng: adminUser.language }),
							...(Array.isArray(alert.textArguments) && {
								postProcess: 'sprintf',
								sprintf: alert.textArguments,
							}),
							...((!Array.isArray(alert.textArguments) && alert.textArguments) || {}), // bien dormido
						})}\n${alert.infoUrl}`,
					})),
			banners: alerts.map((alert) => ({
				id: `alert-${alert.id}`.replace(/\./g, '_'),
				priority: 10,
				title: alert.title,
				text: alert.text,
				textArguments: alert.textArguments,
				modifiers: alert.modifiers,
				link: alert.infoUrl,
			})),
		});
	}
};
