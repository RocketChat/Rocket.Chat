import type { IMessage } from '../../definition/messages';
import type { AppInterface } from '../../definition/metadata';
import type { IRoom } from '../../definition/rooms';
import type { UIKitIncomingInteraction } from '../../definition/uikit';

export interface IListenerBridge {
    messageEvent(int: AppInterface, message: IMessage): Promise<void | boolean | IMessage>;
    roomEvent(int: AppInterface, room: IRoom): Promise<void | boolean | IRoom>;
    uiKitInteractionEvent(int: AppInterface, action: UIKitIncomingInteraction): Promise<void | boolean>;
}
