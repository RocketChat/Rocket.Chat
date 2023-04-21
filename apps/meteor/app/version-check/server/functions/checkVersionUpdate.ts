import semver from 'semver';
import { Settings, Users } from '@rocket.chat/models';
import type { IUser } from '@rocket.chat/core-typings';
import { Translation } from '@rocket.chat/core-services';

import { getNewUpdates } from './getNewUpdates';
import { settings } from '../../../settings/server';
import { Info } from '../../../utils/server';
import logger from '../logger';
import { sendMessagesToAdmins } from '../../../../server/lib/sendMessagesToAdmins';
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
	const language = adminUser.language || settings.get('language') || 'en';
	for await (const alert of alerts) {
		if (!(await Users.bannerExistsById(adminUser._id, `alert-${alert.id}`))) {
			continue;
		}
		msgs.push({
			msg: `*${await Translation.translateText('Rocket_Chat_Alert', language)}))}:*\n\n*${await Translation.translateText(
				alert.title,
				language,
			)})}*\n${await Translation.translateText(alert.text, language, {
				...(Array.isArray(alert.textArguments) && {
					sprintf: alert.textArguments,
				}),
				...(!Array.isArray(alert.textArguments) && alert.textArguments ? { interpolate: { ...(alert.textArguments as any) } } : {}), // bien dormido
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
					msg: `*${await Translation.translateText(
						'Update_your_RocketChat',
						adminUser.language || settings.get('language') || 'en',
					)}*\n${await Translation.translateToServerLanguage('New_version_available_(s)', {
						sprintf: [version.version],
					})}\n${version.infoUrl}`,
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
