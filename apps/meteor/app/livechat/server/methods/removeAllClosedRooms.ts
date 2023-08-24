import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../lib/callbacks';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { Livechat } from '../lib/LivechatTyped';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:removeAllClosedRooms'(departmentIds?: string[]): Promise<number>;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:removeAllClosedRooms'(departmentIds) {
		const user = Meteor.userId();

		if (!user || !(await hasPermissionAsync(user, 'remove-closed-livechat-rooms'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:removeAllClosedRoom',
			});
		}

		// These are not debug logs since we want to know when the action is performed
		Livechat.logger.info(`User ${Meteor.userId()} is removing all closed rooms`);

		const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {});
		const promises: Promise<void>[] = [];
		await LivechatRooms.findClosedRooms(departmentIds, {}, extraQuery).forEach(({ _id }: IOmnichannelRoom) => {
			promises.push(Livechat.removeRoom(_id));
		});
		await Promise.all(promises);

		Livechat.logger.info(`User ${Meteor.userId()} removed ${promises.length} closed rooms`);
		return promises.length;
	},
});
