import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../../../app/authorization/server/functions/hasPermission';
import { businessHourManager } from '../../../../../app/livechat/server/business-hour';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:removeBusinessHour'(id: string, type: string): void;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:removeBusinessHour'(id: string, type: string) {
		const userId = Meteor.userId();

		if (!userId || !(await hasPermissionAsync(userId, 'view-livechat-business-hours'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:removeBusinessHour',
			});
		}

		return businessHourManager.removeBusinessHourByIdAndType(id, type);
	},
});
