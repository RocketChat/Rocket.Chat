import { BlockType } from '@rocket.chat/apps-engine/definition/uikit/blocks/Blocks';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit/blocks/Objects';
import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import moment from 'moment';
import type { IBanner } from '@rocket.chat/core-typings';
import { BannerPlatform } from '@rocket.chat/core-typings';

import { settings } from '../../../app/settings/server';
import { sendMessagesToAdmins } from '../../lib/sendMessagesToAdmins';

export const getBannerForAdmins = Meteor.bindEnvironment((expireAt: Date): Omit<IBanner, '_id'> => {
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
		view: {
			viewId: '',
			appId: '',
			blocks: [
				{
					type: BlockType.SECTION,
					blockId: 'attention',
					text: {
						type: TextObjectType.PLAINTEXT,
						text: TAPi18n.__('NPS_survey_is_scheduled_to-run-at__date__for_all_users', {
							date: moment(expireAt).format('YYYY-MM-DD'),
							lng,
						}),
						emoji: false,
					},
				},
			],
		},
	};
});

export const notifyAdmins = Meteor.bindEnvironment((expireAt: Date) => {
	Promise.await(
		sendMessagesToAdmins({
			msgs: ({ adminUser }: { adminUser: any }): any => ({
				msg: TAPi18n.__('NPS_survey_is_scheduled_to-run-at__date__for_all_users', {
					date: moment(expireAt).format('YYYY-MM-DD'),
					lng: adminUser.language,
				}),
			}),
		}),
	);
});
