import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import semver from 'semver';

import getNewUpdates from './getNewUpdates';
import { settings } from '../../../settings';
import { Info } from '../../../utils';
import { Users } from '../../../models';
import logger from '../logger';
import { sendMessagesToAdmins } from '../../../../server/lib/sendMessagesToAdmins';
import { Settings } from '../../../models/server';
// import getNewUpdates from '../sampleUpdateData';

export default () => {
	logger.info('Checking for version updates');

	const { versions, alerts } = getNewUpdates();

	const update = {
		exists: false,
		lastestVersion: null,
		security: false,
	};

	const lastCheckedVersion = settings.get('Update_LatestAvailableVersion');
	versions.forEach((version) => {
		if (semver.lte(version.version, lastCheckedVersion)) {
			return;
		}

		if (semver.lte(version.version, Info.version)) {
			return;
		}

		update.exists = true;
		update.lastestVersion = version;

		if (version.security === true) {
			update.security = true;
		}
	});

	if (update.exists) {
		Settings.updateValueById('Update_LatestAvailableVersion', update.lastestVersion.version);

		Promise.await(
			sendMessagesToAdmins({
				msgs: ({ adminUser }) => [
					{
						msg: `*${TAPi18n.__('Update_your_RocketChat', adminUser.language)}*\n${TAPi18n.__(
							'New_version_available_(s)',
							update.lastestVersion.version,
							adminUser.language,
						)}\n${update.lastestVersion.infoUrl}`,
					},
				],
				banners: [
					{
						id: `versionUpdate-${update.lastestVersion.version}`.replace(/\./g, '_'),
						priority: 10,
						title: 'Update_your_RocketChat',
						text: 'New_version_available_(s)',
						textArguments: [update.lastestVersion.version],
						link: update.lastestVersion.infoUrl,
					},
				],
			}),
		);
	}

	if (alerts && alerts.length) {
		Promise.await(
			sendMessagesToAdmins({
				msgs: ({ adminUser }) =>
					alerts
						.filter((alert) => !Users.bannerExistsById(adminUser._id, `alert-${alert.id}`))
						.map((alert) => ({
							msg: `*${TAPi18n.__('Rocket_Chat_Alert', adminUser.language)}:*\n\n*${TAPi18n.__(
								alert.title,
								adminUser.language,
							)}*\n${TAPi18n.__(alert.text, ...(alert.textArguments || []), adminUser.language)}\n${alert.infoUrl}`,
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
			}),
		);
	}
};
