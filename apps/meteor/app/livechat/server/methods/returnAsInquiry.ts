import type { ILivechatDepartment, IRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization/server';
import { LivechatRooms } from '../../../models/server';
import { Livechat } from '../lib/Livechat';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:returnAsInquiry'(rid: IRoom['_id'], departmentID?: ILivechatDepartment['_id']): boolean;
	}
}

Meteor.methods<ServerMethods>({
	'livechat:returnAsInquiry'(rid, departmentId) {
		const uid = Meteor.userId();
		if (!uid || !hasPermission(uid, 'view-l-room')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:returnAsInquiry',
			});
		}

		const room = LivechatRooms.findOneById(rid);
		if (!room || room.t !== 'l') {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'livechat:returnAsInquiry',
			});
		}

		if (!room.open) {
			throw new Meteor.Error('room-closed', 'Room closed', { method: 'livechat:returnAsInquiry' });
		}

		return Livechat.returnRoomAsInquiry(rid, departmentId);
	},
});
