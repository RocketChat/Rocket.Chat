import type { ILivechatDepartment, IRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { LivechatRooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { returnRoomAsInquiry } from '../lib/rooms';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:returnAsInquiry'(rid: IRoom['_id'], departmentID?: ILivechatDepartment['_id']): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:returnAsInquiry'(rid, departmentId) {
		methodDeprecationLogger.method('livechat:returnAsInquiry', '8.0.0', '/v1/livechat/inquiries.returnAsInquiry');
		const uid = Meteor.userId();
		if (!uid || !(await hasPermissionAsync(uid, 'view-l-room'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:returnAsInquiry',
			});
		}

		const room = await LivechatRooms.findOneById(rid);
		if (!room || room.t !== 'l') {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'livechat:returnAsInquiry',
			});
		}

		return returnRoomAsInquiry(room, departmentId);
	},
});
