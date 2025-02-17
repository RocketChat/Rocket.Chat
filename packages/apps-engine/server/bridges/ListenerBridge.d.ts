import { BaseBridge } from './BaseBridge';
import type { IMessage } from '../../definition/messages';
import type { AppInterface } from '../../definition/metadata';
import type { IRoom } from '../../definition/rooms';
export declare abstract class ListenerBridge extends BaseBridge {
    doMessageEvent(int: AppInterface, message: IMessage): Promise<void | boolean | IMessage>;
    doRoomEvent(int: AppInterface, room: IRoom): Promise<void | boolean | IRoom>;
    protected abstract messageEvent(int: AppInterface, message: IMessage): Promise<void | boolean | IMessage>;
    protected abstract roomEvent(int: AppInterface, room: IRoom): Promise<void | boolean | IRoom>;
}
