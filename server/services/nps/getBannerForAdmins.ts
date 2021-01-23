import { BlockType } from '@rocket.chat/apps-engine/definition/uikit/blocks/Blocks';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit/blocks/Objects';
import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import moment from 'moment';

import { settings } from '../../../app/settings/server';
import { IBanner, BannerPlatform } from '../../../definition/IBanner';

export const getBannerForAdmins = Meteor.bindEnvironment((): Omit<IBanner, '_id'> => {
	const lng = settings.get('Language') || 'en';

	const today = new Date();
	const inTwoMonths = new Date();
	inTwoMonths.setMonth(inTwoMonths.getMonth() + 2);

	return {
		platform: [BannerPlatform.Web],
		createdAt: today,
		expireAt: inTwoMonths,
		startAt: today,
		roles: ['admin'],
		createdBy: {
			_id: 'rocket.cat',
			username: 'rocket.cat',
		},
		_updatedAt: new Date(),
		view: {
			viewId: '',
			appId: '',
			blocks: [{
				type: BlockType.SECTION,
				blockId: 'attention',
				text: {
					type: TextObjectType.PLAINTEXT,
					text: TAPi18n.__('NPS_survey_is_scheduled_to-run-at__date__for_all_users', { date: moment(inTwoMonths).format('YYYY-MM-DD'), lng }),
					emoji: false,
				},
			}],
		},
	};
});
