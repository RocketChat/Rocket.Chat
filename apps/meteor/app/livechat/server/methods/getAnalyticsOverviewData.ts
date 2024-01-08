import type { AnalyticsOverviewDataResult } from '@rocket.chat/core-services';
import { OmnichannelAnalytics } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { settings } from '../../../settings/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:getAnalyticsOverviewData'(options: { analyticsOptions: { name: string } }): AnalyticsOverviewDataResult[] | void;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:getAnalyticsOverviewData'(options) {
		methodDeprecationLogger.method('livechat:getAnalyticsOverviewData', '7.0.0', ' Use "livechat/analytics/overview" instead.');
		const uid = Meteor.userId();
		if (!uid || !(await hasPermissionAsync(uid, 'view-livechat-manager'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:getAnalyticsOverviewData',
			});
		}

		if (!options.analyticsOptions?.name) {
			return;
		}

		const user = await Users.findOneById(uid, { projection: { _id: 1, utcOffset: 1, language: 1 } });
		const language = user?.language || settings.get('Language') || 'en';

		return OmnichannelAnalytics.getAnalyticsOverviewData({
			...options,
			utcOffset: user?.utcOffset || 0,
			language,
		});
	},
});
