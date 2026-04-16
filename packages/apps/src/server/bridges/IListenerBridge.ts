import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { AppInterface } from '@rocket.chat/apps-engine/definition/metadata';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import type { UIKitIncomingInteraction } from '@rocket.chat/apps-engine/definition/uikit';

export interface IListenerBridge {
	messageEvent(int: AppInterface, message: IMessage): Promise<void | boolean | IMessage>;
	roomEvent(int: AppInterface, room: IRoom): Promise<void | boolean | IRoom>;
	uiKitInteractionEvent(int: AppInterface, action: UIKitIncomingInteraction): Promise<void | boolean>;
}
