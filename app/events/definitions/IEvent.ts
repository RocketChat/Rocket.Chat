import { IEventMessage } from './IEventMessage';
import { IEventGenesis } from './IEventGenesis';

export type EventType = IEventMessage | IEventGenesis;

export interface IEvent<T extends EventType> {
    _cid: string;
    _pids: string[];
    v: number;
    ts: Date;
    src: string;
    // ...contextQuery,
    t: string;
    d: T;
    hasChildren: boolean;
}
