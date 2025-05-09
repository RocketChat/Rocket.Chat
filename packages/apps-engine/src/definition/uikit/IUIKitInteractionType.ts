import type { IUIKitSurface } from './IUIKitSurface';

export enum UIKitInteractionType {
    MODAL_OPEN = 'modal.open',
    MODAL_CLOSE = 'modal.close',
    MODAL_UPDATE = 'modal.update',
    CONTEXTUAL_BAR_OPEN = 'contextual_bar.open',
    CONTEXTUAL_BAR_CLOSE = 'contextual_bar.close',
    CONTEXTUAL_BAR_UPDATE = 'contextual_bar.update',
    ERRORS = 'errors',
}

export interface IUIKitResponse {
    success: boolean;
}

export interface IUIKitInteraction {
    type: UIKitInteractionType;
    triggerId: string;
    appId: string;
}

export interface IUIKitErrorInteraction extends IUIKitInteraction {
    type: UIKitInteractionType.ERRORS;
    viewId: string;
    errors: { [field: string]: string };
}

export interface IUIKitModalInteraction extends IUIKitInteraction {
    type: UIKitInteractionType.MODAL_OPEN | UIKitInteractionType.MODAL_UPDATE | UIKitInteractionType.MODAL_CLOSE;
    view: IUIKitSurface;
}

export interface IUIKitContextualBarInteraction extends IUIKitInteraction {
    type: UIKitInteractionType.CONTEXTUAL_BAR_OPEN | UIKitInteractionType.CONTEXTUAL_BAR_UPDATE | UIKitInteractionType.CONTEXTUAL_BAR_CLOSE;
    view: IUIKitSurface;
}

export interface IUIKitModalResponse extends IUIKitModalInteraction, IUIKitResponse {}
export interface IUIKitContextualBarResponse extends IUIKitContextualBarInteraction, IUIKitResponse {}
export interface IUIKitErrorResponse extends IUIKitErrorInteraction, IUIKitResponse {}
