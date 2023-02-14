import { Meteor } from 'meteor/meteor';

import { getUserPreference } from '../../../../app/utils/client';
import { getConversationRoomType } from '../../../../lib/rooms/roomTypes/conversation';
import { roomCoordinator } from '../roomCoordinator';

export const ConversationRoomType = getConversationRoomType(roomCoordinator);

roomCoordinator.add(ConversationRoomType, {
	condition(): boolean {
		// returns true only if sidebarGroupByType is not set
		return !getUserPreference(Meteor.userId(), 'sidebarGroupByType');
	},
});
