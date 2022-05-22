import { Meteor } from 'meteor/meteor';

import { getUserPreference } from '../../../../app/utils/client';
import { getUnreadRoomType } from '../../../../lib/rooms/roomTypes/unread';
import { roomCoordinator } from '../roomCoordinator';

export const UnreadRoomType = getUnreadRoomType(roomCoordinator);

roomCoordinator.add(UnreadRoomType, {
	condition(): boolean {
		return getUserPreference(Meteor.userId(), 'sidebarShowUnread');
	},
});
