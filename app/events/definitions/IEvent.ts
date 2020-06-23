import { IEventDataEmpty } from './data/IEventDataEmpty';
import { IEventDataUpdate } from './data/IEventDataUpdate';
import { IEventDataRoom } from './data/IEventDataRoom';
import { IEventDataMessage } from './data/IEventDataMessage';

export type IEventData = IEventDataRoom | IEventDataMessage | IEventDataEmpty;

export type EventDataDefinition = IEventDataUpdate<IEventData> | IEventData;

export enum EventContext {
	ROOM = 'room',
}

export enum EventTypeDescriptor {
	// // Global
	// PING = 'ping',

	// Rooms
	ROOM = 'room', // create new room
	DELETE_ROOM = 'droom', // delete room
	PRUNE_ROOM_MESSAGES = 'prune', // prune messages from room
	MESSAGE = 'msg', // new message
	EDIT_MESSAGE = 'emsg', // edit a message content
	DELETE_MESSAGE = 'dmsg', // delete message

	// // Not implemented
	// ADD_USER = 'add_user',
	// REMOVE_USER = 'remove_user',
	// SET_MESSAGE_REACTION = 'set_message_reaction',
	// UNSET_MESSAGE_REACTION = 'unset_message_reaction',
	// MUTE_USER = 'mute_user',
	// UNMUTE_USER = 'unmute_user',
}

export interface IEvent<T extends EventDataDefinition> {
	_id: string;
	clid?: string;
	pids: Array<string>;
	v: number;
	ts: Date;
	src: string;
	ct: EventContext;
	cid: string;
	t: EventTypeDescriptor;
	dHash: string;
	o: T;
	d: T;
	isLeaf: boolean;
	deletedAt?: Date;
}
