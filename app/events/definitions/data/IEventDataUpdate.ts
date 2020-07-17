import { EventDataDefinition } from '../IEvent';

export interface IEventDataUpdate<T extends EventDataDefinition> {
	[key: string]: T;
}
