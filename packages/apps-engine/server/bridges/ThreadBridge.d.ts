import { BaseBridge } from './BaseBridge';
import type { ITypingOptions } from '../../definition/accessors/INotifier';
import type { IMessage } from '../../definition/messages';
export interface ITypingDescriptor extends ITypingOptions {
    isTyping: boolean;
}
export declare abstract class ThreadBridge extends BaseBridge {
    doGetById(messageId: string, appId: string): Promise<Array<IMessage>>;
    protected abstract getById(messageId: string, appId: string): Promise<Array<IMessage>>;
    private hasReadPermission;
}
