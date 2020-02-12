import { EDataDefinition, IEvent } from './IEvent';
import { IAddEventResult } from '../../models/server/models/Events';

export type HandlerMethod<T extends EDataDefinition> = (event: IEvent<T>) => Promise<IAddEventResult>;
