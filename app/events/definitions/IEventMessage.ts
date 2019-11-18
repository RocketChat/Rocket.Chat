export interface IEventMessage {
    _cid: string;
    _pids: [string];
    v: number;
    ts: Date;
    src: string;
    // ...contextQuery,
    t: string;
    hasChildren: boolean;
}
