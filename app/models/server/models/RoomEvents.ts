import { EventsModel, contextDefinitions, eventTypes } from './Events';
import { getLocalSrc } from '../../../events/server/lib/getLocalSrc';

const { type, contextQuery } = contextDefinitions.ROOM;

class RoomEventsModel extends EventsModel {
	constructor() {
		super('message');

		this.tryEnsureIndex({ 'context.roomId': 1 });
		this.tryEnsureIndex({ 'd.msg': 'text' }, { sparse: true });
	}

	ensureSrc(src) {
		return src || getLocalSrc();
	}

	async createGenesisEvent({ src, room }) {
		src = this.ensureSrc(src);

		return super.createGenesisEvent(src, contextQuery(room._id), { d: { contextType: type, room } });
	}

	async createMessageEvent({ src, roomId, _cid, d }) {
		src = this.ensureSrc(src);

		return super.createEvent(src, contextQuery(roomId), { _cid, t: eventTypes.ROOM_MESSAGE, d });
	}

	async createEditMessageEvent({ src, roomId, _cid, d }) {
		src = this.ensureSrc(src);

		return super.createEvent(src, contextQuery(roomId), { _cid, t: eventTypes.ROOM_EDIT_MESSAGE, d });
	}

	async createDeleteRoomEvent(src, roomId) {
		return super.createEvent(src, contextQuery(roomId), eventTypes.ROOM_DELETE, { roomId });
	}

	async createAddUserEvent(src, roomId, user, subscription, domainsAfterAdd) {
		return super.createEvent(src, contextQuery(roomId), eventTypes.ROOM_ADD_USER, { roomId, user, subscription, domainsAfterAdd });
	}

	async createRemoveUserEvent(src, roomId, user, domainsAfterRemoval) {
		return super.createEvent(src, contextQuery(roomId), eventTypes.ROOM_REMOVE_USER, { roomId, user, domainsAfterRemoval });
	}

	async createDeleteMessageEvent(src, roomId, messageId) {
		return super.createEvent(src, contextQuery(roomId), eventTypes.ROOM_DELETE_MESSAGE, { roomId, messageId });
	}

	async createSetMessageReactionEvent(src, roomId, messageId, username, reaction) {
		return super.createEvent(src, contextQuery(roomId), eventTypes.ROOM_SET_MESSAGE_REACTION, { roomId, messageId, username, reaction });
	}

	async createUnsetMessageReactionEvent(src, roomId, messageId, username, reaction) {
		return super.createEvent(src, contextQuery(roomId), eventTypes.ROOM_UNSET_MESSAGE_REACTION, { roomId, messageId, username, reaction });
	}

	async createMuteUserEvent(src, roomId, user) {
		return super.createEvent(src, contextQuery(roomId), eventTypes.ROOM_MUTE_USER, { roomId, user });
	}

	async createUnmuteUserEvent(src, roomId, user) {
		return super.createEvent(src, contextQuery(roomId), eventTypes.ROOM_UNMUTE_USER, { roomId, user });
	}

	async removeRoomEvents(roomId) {
		return super.removeContextEvents(contextQuery(roomId));
	}

	//
	// Backwards compatibility
	//
	fromV1Data(message) {
		return {
			u: message.u,
			msg: message.msg,
			mentions: message.mentions,
			channels: message.channels,
			reactions: message.reactions,
		};
	}

	toV1(event) {
		const v1Data = {
			_id: event._cid,
			v: 1,
			rid: event.rid,
			u: event.d.u,
			ts: event.ts,
			msg: event.d.msg,
			html: event.d.html,
			unread: event.d.unread,
			mentions: event.d.mentions,
			channels: event.d.channels,
			_updatedAt: event._updatedAt,
		};

		if (event.d.reactions) {
			v1Data.reactions = event.d.reactions;
		}

		return v1Data;
	}
}

export const RoomEvents = new RoomEventsModel();
