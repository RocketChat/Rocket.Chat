import { IEDataRoom } from './data/IEDataRoom';
import { IEDataMessage } from './data/IEDataMessage';
import { IEDataUpdate } from './data/IEDataUpdate';
import { IEDataEmpty } from './data/IDataEmpty';

export type IEData = IEDataRoom | IEDataMessage | IEDataEmpty;

export type EDataDefinition = IEDataUpdate<IEData> | IEData;

export enum EventTypeDescriptor {
	// // Global
	// PING = 'ping',

	// Rooms
	ROOM = 'room',
	DELETE_ROOM = 'droom',
	MESSAGE = 'msg',
	EDIT_MESSAGE = 'emsg',
	DELETE_MESSAGE = 'dmsg',

	// // Not implemented
	// ADD_USER = 'add_user',
	// REMOVE_USER = 'remove_user',
	// SET_MESSAGE_REACTION = 'set_message_reaction',
	// UNSET_MESSAGE_REACTION = 'unset_message_reaction',
	// MUTE_USER = 'mute_user',
	// UNMUTE_USER = 'unmute_user',
}

export interface IEvent<T extends EDataDefinition> {
	_id: string;
	_cid?: string;
	_pids: Array<string>;
	v: number;
	ts: Date;
	src: string;
	rid: string;
	t: EventTypeDescriptor;
	dHash: string;
	d: T;
	isLeaf: boolean;
	_deletedAt?: Date;
}
