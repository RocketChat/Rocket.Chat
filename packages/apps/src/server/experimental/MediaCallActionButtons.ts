import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import '@rocket.chat/apps-engine/experimental/MediaCallActionButtons';

import type {
	IUIKitIncomingInteractionActionButtonBase,
	UIKitIncomingInteractionActionButton,
} from '../uikit/UIKitIncomingInteractionActionButton';

export interface IUIKitIncomingInteractionActionButtonMediaCallWidget extends IUIKitIncomingInteractionActionButtonBase {
	room?: IRoom;
	payload: {
		context: 'mediaCallWidgetAction';
		callId: string;
	};
}

export function isIUIKitActionButtonMediaCallWidgetIncomingInteraction(
	interaction: UIKitIncomingInteractionActionButton,
): interaction is IUIKitIncomingInteractionActionButtonMediaCallWidget {
	return interaction.payload.context === 'mediaCallWidgetAction';
}

declare module '../uikit/UIKitIncomingInteractionActionButton' {
	export interface IUIKitIncomingInteractionActionButtonMap {
		mediaCallWidgetAction: IUIKitIncomingInteractionActionButtonMediaCallWidget;
	}
}
