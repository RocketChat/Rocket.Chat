import type { IBanner } from '@rocket.chat/core-typings';
import { BannerPlatform } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { format } from 'date-fns';

import { settings } from '../../../app/settings/server';
import { i18n } from '../../lib/i18n';
import { sendMessagesToAdmins } from '../../lib/sendMessagesToAdmins';

export const getBannerForAdmins = (expireAt: Date): Omit<IBanner, '_id'> => {
	const lng = settings.get<string>('Language') || 'en';

	return {
		platform: [BannerPlatform.Web],
		createdAt: new Date(),
		expireAt,
		startAt: new Date(),
		roles: ['admin'],
		createdBy: {
			_id: 'rocket.cat',
			username: 'rocket.cat',
		},
		_updatedAt: new Date(),
		surface: 'banner',
		view: {
			viewId: Random.id(),
			appId: '',
			blocks: [
				{
					type: 'section',
					blockId: 'attention',
					text: {
						type: 'plain_text',
						text: i18n.t('NPS_survey_is_scheduled_to-run-at__date__for_all_users', {
							date: format(expireAt, 'yyyy-MM-dd'),
							lng,
						}),
						emoji: false,
					},
				},
			],
		},
	};
};

export const notifyAdmins = (expireAt: Date) =>
	sendMessagesToAdmins({
		msgs: async ({ adminUser }: { adminUser: any }): Promise<any> => ({
			msg: i18n.t('NPS_survey_is_scheduled_to-run-at__date__for_all_users', {
				date: format(expireAt, 'yyyy-MM-dd'),
				lng: adminUser.language,
			}),
		}),
	});
