import type { ConversationData } from '@rocket.chat/core-services';
import { OmnichannelAnalytics } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:getAgentOverviewData'(options: { chartOptions: { name: string } }): ConversationData | void;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:getAgentOverviewData'(options) {
		methodDeprecationLogger.method('livechat:getAgentOverviewData', '7.0.0', ' Use "livechat/analytics/agent-overview" instead.');

		const uid = Meteor.userId();
		if (!uid || !(await hasPermissionAsync(uid, 'view-livechat-manager'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:getAgentOverviewData',
			});
		}

		if (!options.chartOptions?.name) {
			return;
		}

		const user = await Users.findOneById(uid, { projection: { _id: 1, utcOffset: 1 } });
		return OmnichannelAnalytics.getAgentOverviewData({ ...options, utcOffset: user?.utcOffset || 0 });
	},
});
