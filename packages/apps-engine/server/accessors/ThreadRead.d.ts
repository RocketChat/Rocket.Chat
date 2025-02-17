import type { IThreadRead } from '../../definition/accessors/IThreadRead';
import type { IMessage } from '../../definition/messages';
import type { ThreadBridge } from '../bridges/ThreadBridge';
export declare class ThreadRead implements IThreadRead {
    private threadBridge;
    private appId;
    constructor(threadBridge: ThreadBridge, appId: string);
    getThreadById(id: string): Promise<Array<IMessage>>;
}
