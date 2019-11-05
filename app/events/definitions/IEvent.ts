import { v4 as uuid } from 'uuid';

export interface IEvent {
    _cid: string;
    _pids: [string];
    v: number;
    ts: Date;
    src: string;
    // ...contextQuery,
    t: string;
    d: object;
    hasChildren: boolean;
}
