import _ from 'underscore';

import { ChatRoom } from '../../../models';

export const roomTypes = new (class RocketChatRoomTypes {
	checkCondition(roomType) {
		return roomType.condition == null || roomType.condition();
	}

	getIdentifiers(e) {
		const except = [].concat(e);
		const list = _.reject(this.roomTypesOrder, (t) => except.indexOf(t.identifier) !== -1);
		return _.map(list, (t) => t.identifier);
	}

	getRoomType(roomId) {
		const fields = {
			t: 1,
		};
		const room = ChatRoom.findOne(
			{
				_id: roomId,
			},
			{
				fields,
			},
		);
		return room && room.t;
	}
})();
