import { FederationEventsModel, contextDefinitions, eventTypes } from './FederationEvents';

const { type, contextQuery } = contextDefinitions.ROOM;

class FederationRoomEventsModel extends FederationEventsModel {
	constructor() {
		super('federation_room_events');
	}

	async createGenesisEvent(origin, room) {
		return super.createGenesisEvent(origin, contextQuery(room._id), { contextType: type, room });
	}

	async createAddUserEvent(origin, roomId, user, subscription) {
		return super.createEvent(origin, contextQuery(roomId), eventTypes.ROOM_ADD_USER, { user, subscription });
	}

	async createMessageEvent(origin, roomId, message) {
		return super.createEvent(origin, contextQuery(roomId), eventTypes.ROOM_MESSAGE, { message });
	}

	async createEditMessageEvent(origin, roomId, originalMessage) {
		const message = {
			_id: originalMessage._id,
			msg: originalMessage.msg,
			federation: originalMessage.federation,
		};

		return super.createEvent(origin, contextQuery(roomId), eventTypes.ROOM_EDIT_MESSAGE, { message });
	}

	async createSetMessageReactionEvent(origin, roomId, messageId, username, reaction) {
		return super.createEvent(origin, contextQuery(roomId), eventTypes.ROOM_SET_MESSAGE_REACTION, { roomId, messageId, username, reaction });
	}

	async createUnsetMessageReactionEvent(origin, roomId, messageId, username, reaction) {
		return super.createEvent(origin, contextQuery(roomId), eventTypes.ROOM_UNSET_MESSAGE_REACTION, { roomId, messageId, username, reaction });
	}

	async createDeleteMessageEvent(origin, roomId, messageId) {
		return super.createEvent(origin, contextQuery(roomId), eventTypes.ROOM_DELETE_MESSAGE, { roomId, messageId });
	}

	async createDeleteRoomEvent(origin, roomId) {
		return super.createEvent(origin, contextQuery(roomId), eventTypes.ROOM_DELETE, { roomId });
	}

	async removeRoomEvents(roomId) {
		return super.removeContextEvents(contextQuery(roomId));
	}
}

export const FederationRoomEvents = new FederationRoomEventsModel();
