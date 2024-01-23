import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { i18n } from '../../../../server/lib/i18n';
import { sendMessagesToAdmins } from '../../../../server/lib/sendMessagesToAdmins';
import logger from '../logger';
import { buildVersionUpdateMessage } from './buildVersionUpdateMessage';
import { getNewUpdates } from './getNewUpdates';

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
/**
 * @deprecated
 */
export const checkVersionUpdate = async () => {
	logger.info('Checking for version updates');

	const { versions, alerts } = await getNewUpdates();

	await buildVersionUpdateMessage(versions);

	await showAlertsFromCloud(alerts);
};

const showAlertsFromCloud = async (
	alerts?: {
		id: string;
		priority: number;
		title: string;
		text: string;
		textArguments?: string[];
		modifiers: string[];
		infoUrl: string;
	}[],
) => {
	if (!alerts?.length) {
		return;
	}
	return sendMessagesToAdmins({
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
};
