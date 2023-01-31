import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { LivechatRooms } from '../../../models/server';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	async 'livechat:removeAllClosedRooms'(departmentIds: string[]) {
		const user = Meteor.userId();

		if (!user || !(await hasPermissionAsync(user, 'remove-closed-livechat-rooms'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:removeAllClosedRoom',
			});
		}

		let count = 0;
		// These are not debug logs since we want to know when the action is performed
		Livechat.logger.info(`User ${Meteor.userId()} is removing all closed rooms`);

		const rooms: IOmnichannelRoom[] = LivechatRooms.findClosedRooms(departmentIds);
		const promises: Promise<void>[] = [];
		rooms.forEach(({ _id }) => {
			promises.push(Livechat.removeRoom(_id));
			count++;
		});
		await Promise.all(promises);

		Livechat.logger.info(`User ${Meteor.userId()} removed ${count} closed rooms`);
		return count;
	},
});
