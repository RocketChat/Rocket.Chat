import type { ILivechatBusinessHour } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { businessHourManager } from '../business-hour';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:saveBusinessHour'(businessHourData: ILivechatBusinessHour): void;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:saveBusinessHour'(businessHourData) {
		methodDeprecationLogger.method('livechat:saveBusinessHour', '8.0.0', '/v1/livechat/business-hours.save');
		try {
			await businessHourManager.saveBusinessHour(businessHourData);
		} catch (e) {
			throw new Meteor.Error(e instanceof Error ? e.message : String(e));
		}
	},
});
