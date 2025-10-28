import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { takeInquiry } from '../lib/takeInquiry';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:takeInquiry'(
			inquiryId: string,
			options?: { clientAction: boolean; forwardingToDepartment?: { oldDepartmentId: string; transferData: any } },
		): unknown;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:takeInquiry'(inquiryId, options) {
		methodDeprecationLogger.method('livechat:takeInquiry', '8.0.0', '/v1/livechat/inquiries.take');
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-not-allowed', 'Invalid User', {
				method: 'livechat:takeInquiry',
			});
		}

		if (!(await hasPermissionAsync(uid, 'view-l-room'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:takeInquiry',
			});
		}

		return takeInquiry(uid, inquiryId, options);
	},
});
