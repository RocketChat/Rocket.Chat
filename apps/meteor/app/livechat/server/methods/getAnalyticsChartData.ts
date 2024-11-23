import type { ChartDataResult } from '@rocket.chat/core-services';
import { OmnichannelAnalytics } from '@rocket.chat/core-services';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:getAnalyticsChartData'(options: { chartOptions: { name: string } }): ChartDataResult | void;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:getAnalyticsChartData'(options) {
		const userId = Meteor.userId();
		if (!userId || !(await hasPermissionAsync(userId, 'view-livechat-manager'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:getAnalyticsChartData',
			});
		}

		if (!options.chartOptions?.name) {
			return;
		}

		const user = await Users.findOneById(userId, { projection: { _id: 1, utcOffset: 1 } });

		if (!user) {
			return;
		}

		return OmnichannelAnalytics.getAnalyticsChartData({ ...options, utcOffset: user?.utcOffset });
	},
});
