import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import moment from 'moment';

import { settings } from '../../../app/settings/server';
import { BannerPlatform } from '../../../definition/IBanner';

export const getBannerForAdmins = Meteor.bindEnvironment(() => {
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
				type: 'section',
				blockId: 'attention',
				text: {
					type: 'plain_text',
					text: TAPi18n.__('NPS_survey_is_scheduled_to-run-at__date__for_all_users', { date: moment(inTwoMonths).format('YYYY-MM-DD'), lng }),
					emoji: false,
				},
			}],
		},
	};
});
