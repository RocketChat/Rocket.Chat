import type { IMessage } from '../messages';
import type { IRoom } from '../rooms';
import type { IUser } from '../users';

interface IUIKitIncomingInteractionActionButtonBase {
	triggerId: string;
	type: 'actionButton';

	user: IUser;
	actionId: string;
	appId: string;

	payload: Record<string, any>;
}

interface IUIKitIncomingInteractionActionButtonMessageBox {
	triggerId: string;

	type: 'actionButton';
	room: IRoom;
	tmid?: string;

	user: IUser;

	actionId: string;
	appId: string;

	payload: {
		context: 'messageBoxAction';
		message?: string;
	};
}

/** Narrows an action button interaction to one from the message composer. */
export const isUIKitIncomingInteractionActionButtonMessageBox = (
	interaction: IUIKitIncomingInteractionActionButtonBase,
): interaction is IUIKitIncomingInteractionActionButtonMessageBox => {
	return interaction.payload.context === 'messageBoxAction';
};

interface IUIKitIncomingInteractionActionButtonMessage extends IUIKitIncomingInteractionActionButtonBase {
	room: IRoom;
	tmid?: string;

	message: IMessage;

	payload: {
		context: 'messageAction';
	};
}

interface IUIKitIncomingInteractionActionButtonRoomSidebar extends IUIKitIncomingInteractionActionButtonBase {
	room: IRoom;

	payload: {
		context: 'roomSideBarAction';
	};
}

interface IUIKitIncomingInteractionActionButtonRoom extends IUIKitIncomingInteractionActionButtonBase {
	room: IRoom;

	payload: {
		context: 'roomAction';
	};
}

interface IUIKitIncomingInteractionActionButtonUserDropdown extends IUIKitIncomingInteractionActionButtonBase {
	payload: {
		context: 'userDropdownAction';
	};
}

/**
 * An action button press, narrowed by `payload.context` to the surface the
 * button was on.
 *
 * Each variant carries only what its surface has: a room, a message, or
 * neither.
 */
export type IUIKitIncomingInteractionActionButton =
	| IUIKitIncomingInteractionActionButtonMessageBox
	| IUIKitIncomingInteractionActionButtonMessage
	| IUIKitIncomingInteractionActionButtonRoomSidebar
	| IUIKitIncomingInteractionActionButtonRoom
	| IUIKitIncomingInteractionActionButtonUserDropdown;
