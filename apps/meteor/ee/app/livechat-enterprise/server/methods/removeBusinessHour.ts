import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../../app/authorization/server';
import { businessHourManager } from '../../../../../app/livechat/server/business-hour';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:removeBusinessHour'(id: string, type: string): void;
	}
}

Meteor.methods<ServerMethods>({
	'livechat:removeBusinessHour'(id: string, type: string) {
		const userId = Meteor.userId();

		if (!userId || !hasPermission(userId, 'view-livechat-business-hours')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:removeBusinessHour',
			});
		}

		return Promise.await(businessHourManager.removeBusinessHourByIdAndType(id, type));
	},
});
