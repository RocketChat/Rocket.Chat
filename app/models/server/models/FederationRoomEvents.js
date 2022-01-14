import { FederationEventsModel, contextDefinitions, eventTypes } from './FederationEvents';

const { type, contextQuery } = contextDefinitions.ROOM;

class FederationRoomEventsModel extends FederationEventsModel {
	constructor() {
		super('federation_room_events');

		this.tryEnsureIndex({ 'context.roomId': 1 });
	}

	async createGenesisEvent(origin, room) {
		return super.createGenesisEvent(origin, contextQuery(room._id), { contextType: type, room });
	}

	async createDeleteRoomEvent(origin, roomId) {
		return super.createEvent(origin, contextQuery(roomId), eventTypes.ROOM_DELETE, { roomId });
	}

	async createAddUserEvent(origin, roomId, user, subscription, domainsAfterAdd) {
		return super.createEvent(origin, contextQuery(roomId), eventTypes.ROOM_ADD_USER, {
			roomId,
			user,
			subscription,
			domainsAfterAdd,
		});
	}

	async createRemoveUserEvent(origin, roomId, user, domainsAfterRemoval) {
		return super.createEvent(origin, contextQuery(roomId), eventTypes.ROOM_REMOVE_USER, {
			roomId,
			user,
			domainsAfterRemoval,
		});
	}

	async createUserLeftEvent(origin, roomId, user, domainsAfterLeave) {
		return super.createEvent(origin, contextQuery(roomId), eventTypes.ROOM_USER_LEFT, {
			roomId,
			user,
			domainsAfterLeave,
		});
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

		return super.createEvent(origin, contextQuery(roomId), eventTypes.ROOM_EDIT_MESSAGE, {
			message,
		});
	}

	async createDeleteMessageEvent(origin, roomId, messageId) {
		return super.createEvent(origin, contextQuery(roomId), eventTypes.ROOM_DELETE_MESSAGE, {
			roomId,
			messageId,
		});
	}

	async createSetMessageReactionEvent(origin, roomId, messageId, username, reaction) {
		return super.createEvent(origin, contextQuery(roomId), eventTypes.ROOM_SET_MESSAGE_REACTION, {
			roomId,
			messageId,
			username,
			reaction,
		});
	}

	async createUnsetMessageReactionEvent(origin, roomId, messageId, username, reaction) {
		return super.createEvent(origin, contextQuery(roomId), eventTypes.ROOM_UNSET_MESSAGE_REACTION, {
			roomId,
			messageId,
			username,
			reaction,
		});
	}

	async createMuteUserEvent(origin, roomId, user) {
		return super.createEvent(origin, contextQuery(roomId), eventTypes.ROOM_MUTE_USER, {
			roomId,
			user,
		});
	}

	async createUnmuteUserEvent(origin, roomId, user) {
		return super.createEvent(origin, contextQuery(roomId), eventTypes.ROOM_UNMUTE_USER, {
			roomId,
			user,
		});
	}

	async removeRoomEvents(roomId) {
		return super.removeContextEvents(contextQuery(roomId));
	}
}

export const FederationRoomEvents = new FederationRoomEventsModel();
