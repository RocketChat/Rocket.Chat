import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

export interface IUIKitIncomingInteractionActionButtonBase {
	triggerId: string;
	type: 'actionButton';

	user: IUser;
	actionId: string;
	appId: string;

	payload: Record<string, any>;
}

export interface IUIKitIncomingInteractionActionButtonMessageBox {
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

export type IUIKitIncomingInteractionActionButton =
	| IUIKitIncomingInteractionActionButtonMessageBox
	| IUIKitIncomingInteractionActionButtonMessage
	| IUIKitIncomingInteractionActionButtonRoomSidebar
	| IUIKitIncomingInteractionActionButtonRoom
	| IUIKitIncomingInteractionActionButtonUserDropdown;
