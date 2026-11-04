import type { IUIKitSurface } from './IUIKitSurface';

export enum UIKitInteractionType {
	MODAL_OPEN = 'modal.open',
	MODAL_CLOSE = 'modal.close',
	MODAL_UPDATE = 'modal.update',
	MODAL_PUSH = 'modal.push',
	MODAL_CLEAR = 'modal.clear',
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
	type:
		| UIKitInteractionType.MODAL_OPEN
		| UIKitInteractionType.MODAL_UPDATE
		| UIKitInteractionType.MODAL_PUSH
		| UIKitInteractionType.MODAL_CLOSE;
	view: IUIKitSurface;
}

export interface IUIKitModalCloseInteraction extends IUIKitInteraction {
	type: UIKitInteractionType.MODAL_CLOSE;
	viewId?: string;
}

export interface IUIKitModalClearInteraction extends IUIKitInteraction {
	type: UIKitInteractionType.MODAL_CLEAR;
}

export interface IUIKitContextualBarInteraction extends IUIKitInteraction {
	type: UIKitInteractionType.CONTEXTUAL_BAR_OPEN | UIKitInteractionType.CONTEXTUAL_BAR_UPDATE | UIKitInteractionType.CONTEXTUAL_BAR_CLOSE;
	view: IUIKitSurface;
}

export interface IUIKitModalResponse extends IUIKitModalInteraction, IUIKitResponse {}
export interface IUIKitModalCloseResponse extends IUIKitModalCloseInteraction, IUIKitResponse {}
export interface IUIKitModalClearResponse extends IUIKitModalClearInteraction, IUIKitResponse {}
export interface IUIKitContextualBarResponse extends IUIKitContextualBarInteraction, IUIKitResponse {}
export interface IUIKitErrorResponse extends IUIKitErrorInteraction, IUIKitResponse {}
