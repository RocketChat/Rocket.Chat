export enum UIKitIncomingInteractionContainerType {
    MESSAGE = 'message',
    VIEW = 'view',
}

export interface IUIKitIncomingInteractionContainer {
    type: UIKitIncomingInteractionContainerType;
    id: string;
}
export interface IUIKitIncomingInteractionModalContainer extends IUIKitIncomingInteractionContainer {
    type: UIKitIncomingInteractionContainerType.VIEW;
}
export interface IUIKitIncomingInteractionContextualBarContainer extends IUIKitIncomingInteractionContainer {
    type: UIKitIncomingInteractionContainerType.VIEW;
}
export interface IUIKitIncomingInteractionMessageContainer extends IUIKitIncomingInteractionContainer {
    type: UIKitIncomingInteractionContainerType.MESSAGE;
}
