import { EventContext } from '../IEvent';
import { IRoomEventDataRoom } from './data/IRoomEventDataRoom';
import { IRoomEventDataMessage } from './data/IRoomEventDataMessage';
import { IEventDataEmpty } from '../data/IEventDataEmpty';
import { IEventDataUpdate } from '../data/IEventDataUpdate';

export type IEventDataRoom = IRoomEventDataRoom | IRoomEventDataMessage | IEventDataEmpty;

export type EventRoomDataDefinition = IEventDataUpdate<IEventDataRoom> | IEventDataRoom;

export enum RoomEventTypeDescriptor {
	ROOM = 'room', // create new room
	DELETE_ROOM = 'droom', // delete room
	PRUNE_ROOM_MESSAGES = 'prune', // prune messages from room
	MESSAGE = 'msg', // new message
	EDIT_MESSAGE = 'emsg', // edit a message content
	DELETE_MESSAGE = 'dmsg', // delete message

	// Not yet implemented
	// ADD_USER = 'add_user',
	// REMOVE_USER = 'remove_user',
	// SET_MESSAGE_REACTION = 'set_message_reaction',
	// UNSET_MESSAGE_REACTION = 'unset_message_reaction',
	// MUTE_USER = 'mute_user',
	// UNMUTE_USER = 'unmute_user',
}

export interface IRoomEvent {
	ct: EventContext.ROOM;
	t: RoomEventTypeDescriptor;
	d: EventRoomDataDefinition;
}
