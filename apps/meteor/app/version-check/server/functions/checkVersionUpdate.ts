import type { IUser } from '@rocket.chat/core-typings';
import { Settings, Users } from '@rocket.chat/models';
import semver from 'semver';

import { i18n } from '../../../../server/lib/i18n';
import { sendMessagesToAdmins } from '../../../../server/lib/sendMessagesToAdmins';
import { settings } from '../../../settings/server';
import { Info } from '../../../utils/rocketchat.info';
import logger from '../logger';
import { getNewUpdates } from './getNewUpdates';
// import getNewUpdates from '../sampleUpdateData';

const getMessagesToSendToAdmins = async (
	alerts: {
		id: string;
		priority: number;
		title: string;
		text: string;
		textArguments?: string[];
		modifiers: string[];
		infoUrl: string;
	}[],
	adminUser: IUser,
): Promise<{ msg: string }[]> => {
	const msgs = [];
	for await (const alert of alerts) {
		if (!(await Users.bannerExistsById(adminUser._id, `alert-${alert.id}`))) {
			continue;
		}
		msgs.push({
			msg: `*${i18n.t('Rocket_Chat_Alert', { ...(adminUser.language && { lng: adminUser.language }) })}:*\n\n*${i18n.t(alert.title, {
				...(adminUser.language && { lng: adminUser.language }),
			})}*\n${i18n.t(alert.text, {
				...(adminUser.language && { lng: adminUser.language }),
				...(Array.isArray(alert.textArguments) && {
					postProcess: 'sprintf',
					sprintf: alert.textArguments,
				}),
				...((!Array.isArray(alert.textArguments) && alert.textArguments) || {}), // bien dormido
			})}\n${alert.infoUrl}`,
		});
	}
	return msgs;
};

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

	if (alerts?.length) {
		await sendMessagesToAdmins({
			msgs: async ({ adminUser }) => getMessagesToSendToAdmins(alerts, adminUser),
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
