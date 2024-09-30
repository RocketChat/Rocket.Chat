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
