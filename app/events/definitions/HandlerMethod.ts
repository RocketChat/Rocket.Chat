import { EventDataDefinition, IEvent } from './IEvent';
import { IAddEventResult } from '../../models/server/models/Events';

export type HandlerMethod<T extends EventDataDefinition> = (event: IEvent<T>) => Promise<IAddEventResult>;
