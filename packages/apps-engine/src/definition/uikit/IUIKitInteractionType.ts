import type { IUIKitSurface } from './IUIKitSurface';

/** What an App is asking Rocket.Chat to do with one of its surfaces. */
export enum UIKitInteractionType {
	MODAL_OPEN = 'modal.open',
	MODAL_CLOSE = 'modal.close',
	MODAL_UPDATE = 'modal.update',
	CONTEXTUAL_BAR_OPEN = 'contextual_bar.open',
	CONTEXTUAL_BAR_CLOSE = 'contextual_bar.close',
	CONTEXTUAL_BAR_UPDATE = 'contextual_bar.update',
	ERRORS = 'errors',
}

/** Whether Rocket.Chat carried out the interaction the App asked for. */
export interface IUIKitResponse {
	success: boolean;
}

/**
 * An App's request to show, change or dismiss one of its surfaces.
 *
 * Narrow by `type` to the modal, contextual bar or error variant.
 */
export interface IUIKitInteraction {
	/** What to do with the surface. */
	type: UIKitInteractionType;
	/**
	 * The user action this answers.
	 *
	 * It comes from the incoming interaction and it expires, which is why an
	 * App cannot show a surface out of the blue.
	 */
	triggerId: string;
	/** The App asking. */
	appId: string;
}

/** Marks fields of an open surface as wrong, keeping the surface open. */
export interface IUIKitErrorInteraction extends IUIKitInteraction {
	type: UIKitInteractionType.ERRORS;
	/** The surface to show the errors on. */
	viewId: string;
	/** What is wrong with each field, keyed by the input's action id. */
	errors: { [field: string]: string };
}

/** Shows, changes or dismisses a modal. */
export interface IUIKitModalInteraction extends IUIKitInteraction {
	type: UIKitInteractionType.MODAL_OPEN | UIKitInteractionType.MODAL_UPDATE | UIKitInteractionType.MODAL_CLOSE;
	/** The modal to render. */
	view: IUIKitSurface;
}

/** Shows, changes or dismisses a contextual bar. */
export interface IUIKitContextualBarInteraction extends IUIKitInteraction {
	type: UIKitInteractionType.CONTEXTUAL_BAR_OPEN | UIKitInteractionType.CONTEXTUAL_BAR_UPDATE | UIKitInteractionType.CONTEXTUAL_BAR_CLOSE;
	/** The contextual bar to render. */
	view: IUIKitSurface;
}

/** What Rocket.Chat answers an {@link IUIKitModalInteraction} with. */
export interface IUIKitModalResponse extends IUIKitModalInteraction, IUIKitResponse {}
/** What Rocket.Chat answers an {@link IUIKitContextualBarInteraction} with. */
export interface IUIKitContextualBarResponse extends IUIKitContextualBarInteraction, IUIKitResponse {}
/** What Rocket.Chat answers an {@link IUIKitErrorInteraction} with. */
export interface IUIKitErrorResponse extends IUIKitErrorInteraction, IUIKitResponse {}
