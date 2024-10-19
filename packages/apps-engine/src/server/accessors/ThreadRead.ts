import type { IThreadRead } from '../../definition/accessors/IThreadRead';
import type { IMessage } from '../../definition/messages';
import type { ThreadBridge } from '../bridges/ThreadBridge';

export class ThreadRead implements IThreadRead {
    constructor(private threadBridge: ThreadBridge, private appId: string) {}

    public getThreadById(id: string): Promise<Array<IMessage>> {
        return this.threadBridge.doGetById(id, this.appId);
    }
}
