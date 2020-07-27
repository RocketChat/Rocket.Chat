import { IEventDataEmpty } from './data/IEventDataEmpty';
import { IEventDataUpdate } from './data/IEventDataUpdate';
import { RoomEventTypeDescriptor, EventRoomDataDefinition } from './room/IRoomEvent';

export type IEventData = IEventDataEmpty;

export type EventDataDefinition = IEventDataUpdate<IEventData> | IEventData | EventRoomDataDefinition;

//
// All the possible event contexts
export enum EventContext {
	ROOM = 'room',
}

//
// The global events
export enum GlobalEventTypeDescriptor {
	PING = 'ping',
}

//
// Merge all event types into a common type
export type EventTypeDescriptor = GlobalEventTypeDescriptor | RoomEventTypeDescriptor;

//
// The base event
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
	isLeaf?: boolean;
	deletedAt?: Date;
}
