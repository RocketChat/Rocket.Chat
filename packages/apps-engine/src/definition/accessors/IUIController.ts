import type { IUIKitErrorInteraction, IUIKitInteraction, IUIKitSurface } from '../uikit';
import type { IUIKitContextualBarViewParam, IUIKitModalViewParam } from '../uikit/UIKitInteractionResponder';
import type { IUser } from '../users';

/** Which interaction a surface is being opened for. The engine fills in the App and the kind. */
export type IUIKitInteractionParam = Omit<IUIKitInteraction, 'appId' | 'type'>;
/** Which surface to show errors on, and the error for each of its fields. */
export type IUIKitErrorInteractionParam = Omit<IUIKitErrorInteraction, 'type' | 'appId' | 'triggerId'>;

/** A surface as an App defines it. Supply an id to update a surface, leave it out to open a new one. */
export type IUIKitSurfaceViewParam = Omit<IUIKitSurface, 'appId' | 'id'> & Partial<Pick<IUIKitSurface, 'id'>>;

/**
 * Opens and updates the surfaces an App shows a user: a modal, a contextual
 * bar, or the errors on one.
 *
 * A surface can only be opened in response to something the user did, because
 * every call needs the `triggerId` that came with the interaction. It needs
 * the `ui.interact` permission.
 */
export interface IUIController {
	/**
	 * @deprecated please prefer the `openSurfaceView` method
	 */
	openModalView(view: IUIKitModalViewParam, context: IUIKitInteractionParam, user: IUser): Promise<void>;
	/**
	 * @deprecated please prefer the `updateSurfaceView` method
	 */
	updateModalView(view: IUIKitModalViewParam, context: IUIKitInteractionParam, user: IUser): Promise<void>;
	/**
	 * @deprecated please prefer the `openSurfaceView` method
	 */
	openContextualBarView(view: IUIKitContextualBarViewParam, context: IUIKitInteractionParam, user: IUser): Promise<void>;
	/**
	 * @deprecated please prefer the `updateSurfaceView` method
	 */
	updateContextualBarView(view: IUIKitContextualBarViewParam, context: IUIKitInteractionParam, user: IUser): Promise<void>;
	/** Shows validation errors on the surface the user just submitted, keeping it open. */
	setViewError(errorInteraction: IUIKitErrorInteractionParam, context: IUIKitInteractionParam, user: IUser): Promise<void>;
	/** Shows a new surface to the user. Its `type` decides whether it is a modal or a contextual bar. */
	openSurfaceView(view: IUIKitSurfaceViewParam, context: IUIKitInteractionParam, user: IUser): Promise<void>;
	/** Replaces the contents of a surface the user already has open. */
	updateSurfaceView(view: IUIKitSurfaceViewParam, context: IUIKitInteractionParam, user: IUser): Promise<void>;
}
